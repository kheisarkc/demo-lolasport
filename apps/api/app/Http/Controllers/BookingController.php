<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class BookingController extends Controller
{
    public function index(Request $request, BookingService $service): JsonResponse
    {
        abort_unless(in_array($request->user()->role, ['customer', 'staff'], true), 403);
        $service->expire();
        $query = Booking::with('court', 'payments', 'events')->orderByDesc('id');
        if ($request->user()->role === 'customer') {
            $query->where('customer_id', $request->user()->id);
        }

        return response()->json($query->get());
    }

    public function show(Booking $booking, BookingService $service): JsonResponse
    {
        Gate::authorize('view', $booking);
        $service->expire();

        return response()->json([...$booking->refresh()->load('court', 'payments', 'events')->toArray(), 'server_now' => now()->toIso8601String()]);
    }

    public function store(Request $request, BookingService $service): JsonResponse
    {
        abort_unless(in_array($request->user()->role, ['customer', 'staff'], true), 403);
        $data = $request->validate($this->rules($request->user()->role === 'staff'));

        return response()->json($service->create($request->user(), $data), 201);
    }

    public function block(Request $request, BookingService $service): JsonResponse
    {
        Gate::authorize('staff');
        $data = $request->validate([...$this->rules(false), 'reason' => 'required|string|min:3|max:200']);

        return response()->json($service->create($request->user(), $data, true), 201);
    }

    public function cancel(Request $request, Booking $booking, BookingService $service): JsonResponse
    {
        Gate::authorize('update', $booking);

        return response()->json($service->cancel($booking, $request->user()));
    }

    private function rules(bool $walkin): array
    {
        return ['court_id' => 'required|integer|exists:courts,id', 'date' => 'required|date_format:Y-m-d', 'hour' => 'required|integer|min:0|max:23', 'duration' => 'required|integer|min:1|max:14', 'customer_name' => $walkin ? 'required|string|max:80' : 'nullable|string|max:80'];
    }
}
