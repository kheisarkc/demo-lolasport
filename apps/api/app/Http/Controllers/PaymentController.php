<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Payment;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PaymentController extends Controller
{
    public function store(Request $request, Booking $booking, BookingService $service): JsonResponse
    {
        abort_unless(BookingController::canAccess($request, $booking), 403);
        $staff = $request->user()?->role === 'staff';
        abort_if(! $staff && $request->input('method') !== 'qris', 403, 'Tunai dicatat penjaga di tempat.');
        $data = $request->validate([
            'amount' => 'required|integer|min:1|max:2000000000',
            'method' => $staff ? 'required|in:cash,qris' : 'required|in:qris',
            'proof' => $staff ? 'prohibited' : 'required|file|mimes:jpg,jpeg,png,pdf|extensions:jpg,jpeg,png,pdf|max:2048',
        ]);

        return response()->json($service->submit($booking, $request->user(), $data, $request->file('proof')), 201);
    }

    public function review(Request $request, Payment $payment, BookingService $service): JsonResponse
    {
        Gate::authorize('staff');
        $data = $request->validate(['decision' => 'required|in:approved,rejected', 'reason' => 'required_if:decision,rejected|nullable|string|min:3|max:200']);

        return response()->json($service->review($payment, $request->user(), $data['decision'], $data['reason'] ?? null));
    }

    public function proof(Request $request, Payment $payment): StreamedResponse
    {
        abort_unless(BookingController::canAccess($request, $payment->booking), 403);
        abort_unless($payment->proof_path && Storage::disk('local')->exists($payment->proof_path), 404);

        return Storage::disk('local')->download($payment->proof_path, 'bukti-demo-'.$payment->id.'.'.pathinfo($payment->proof_path, PATHINFO_EXTENSION), ['X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'private, no-store']);
    }
}
