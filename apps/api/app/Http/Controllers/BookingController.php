<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    /** Penjaga dan pemilik masuk lewat akun; pelanggan cukup token pesanan. */
    public static function canAccess(Request $request, Booking $booking): bool
    {
        if ($request->user()?->role === 'staff') {
            return true;
        }
        $token = (string) ($request->header('X-Booking-Token') ?: $request->query('token'));

        return $token !== '' && hash_equals($booking->accessToken(), $token);
    }

    public static function normalizePhone(?string $phone): string
    {
        $digits = preg_replace('/\D/', '', (string) $phone);

        return str_starts_with($digits, '62') ? '0'.substr($digits, 2) : $digits;
    }

    public function index(Request $request, BookingService $service): JsonResponse
    {
        Gate::authorize('staff');
        $service->expire();

        return response()->json(Booking::with('court', 'payments', 'events')->orderByDesc('id')->get());
    }

    public function show(Request $request, Booking $booking, BookingService $service): JsonResponse
    {
        abort_unless(self::canAccess($request, $booking), 403, 'Buka pesanan lewat Cek pesanan dengan kode dan nomor WhatsApp.');
        $service->expire();

        return response()->json([...$booking->refresh()->load('court', 'payments', 'events')->toArray(), 'server_now' => now()->toIso8601String()]);
    }

    /** Tamu memesan lewat web. Penjaga yang masuk membuat walk-in dan langsung mencatat bayar. */
    public function store(Request $request, BookingService $service): JsonResponse
    {
        $user = $request->user();
        abort_if($user && $user->role !== 'staff', 403, 'Pemilik tidak membuat pesanan.');
        $staff = $user?->role === 'staff';
        $request->merge(['customer_phone' => $request->filled('customer_phone') ? self::normalizePhone($request->input('customer_phone')) : null]);
        $data = $request->validate([
            ...$this->rules(),
            'customer_name' => 'required|string|min:2|max:80',
            'customer_phone' => ($staff ? 'nullable' : 'required').'|regex:/^08\d{8,12}$/',
            'amount' => $staff ? 'required|integer|min:1' : 'prohibited',
            'method' => $staff ? 'required|in:cash,qris' : 'prohibited',
        ], ['customer_phone.regex' => 'Nomor WhatsApp diawali 08, 10–14 angka.', 'customer_phone.required' => 'Nomor WhatsApp wajib diisi.']);
        $booking = $service->create($user, $data);

        return response()->json([...$booking->toArray(), 'access_token' => $booking->accessToken()], 201);
    }

    /** Cek pesanan: kode + nomor WhatsApp yang dipakai saat memesan. */
    public function lookup(Request $request): JsonResponse
    {
        $data = $request->validate(['code' => 'required|string|max:12', 'customer_phone' => 'required|string|max:20']);
        $booking = Booking::where('code', strtoupper(trim($data['code'])))->where('source', '!=', 'block')->first();
        if (! $booking || ! $booking->customer_phone || ! hash_equals($booking->customer_phone, self::normalizePhone($data['customer_phone']))) {
            throw ValidationException::withMessages(['code' => 'Kode booking atau nomor WhatsApp tidak cocok.']);
        }

        return response()->json(['code' => $booking->code, 'access_token' => $booking->accessToken()]);
    }

    public function block(Request $request, BookingService $service): JsonResponse
    {
        Gate::authorize('staff');
        $data = $request->validate([...$this->rules(), 'reason' => 'required|string|min:3|max:200']);

        return response()->json($service->create($request->user(), $data, true), 201);
    }

    public function cancel(Request $request, Booking $booking, BookingService $service): JsonResponse
    {
        abort_unless(self::canAccess($request, $booking), 403);

        return response()->json($service->cancel($booking, $request->user()));
    }

    public function checkIn(Request $request, Booking $booking, BookingService $service): JsonResponse
    {
        Gate::authorize('staff');

        return response()->json($service->checkIn($booking, $request->user()));
    }

    public function noShow(Request $request, Booking $booking, BookingService $service): JsonResponse
    {
        Gate::authorize('staff');

        return response()->json($service->noShow($booking, $request->user()));
    }

    private function rules(): array
    {
        return ['court_id' => 'required|integer|exists:courts,id', 'date' => 'required|date_format:Y-m-d', 'hour' => 'required|integer|min:0|max:24', 'duration' => 'required|integer|min:1|max:18'];
    }
}
