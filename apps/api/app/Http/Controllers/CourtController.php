<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Setting;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CourtController extends Controller
{
    /** Jadwal publik satu tanggal operasional (07.00 sampai 01.00 dini hari berikutnya). */
    public function index(Request $request, BookingService $service): JsonResponse
    {
        $data = $request->validate(['date' => 'nullable|date_format:Y-m-d']);
        $date = $data['date'] ?? BookingService::today()->format('Y-m-d');
        $service->expire();
        $dayStart = BookingService::slotStart($date, config('demo.open_hour'));
        $dayEnd = BookingService::slotStart($date, config('demo.close_hour'));
        $courts = Court::where('active', true)->orderBy('id')->get()->map(function (Court $court) use ($date, $dayStart, $dayEnd) {
            $busy = Booking::where('court_id', $court->id)->whereIn('status', Booking::HOLDING)->where('starts_at', '<', $dayEnd->utc())->where('ends_at', '>', $dayStart->utc())->get();
            $slots = [];
            for ($hour = config('demo.open_hour'); $hour < config('demo.close_hour'); $hour++) {
                $start = BookingService::slotStart($date, $hour)->utc();
                $end = $start->addHour();
                $occupied = $busy->first(fn (Booking $b) => $b->starts_at->lt($end) && $b->ends_at->gt($start));
                $status = $occupied ? ($occupied->source === 'block' ? 'blocked' : 'booked') : ($start->isFuture() ? 'available' : 'past');
                $slots[] = ['hour' => $hour, 'available' => $status === 'available', 'status' => $status];
            }

            return [...$court->toArray(), 'slots' => $slots];
        });
        $setting = Setting::current();

        return response()->json([
            'date' => $date, 'today' => BookingService::today()->format('Y-m-d'), 'max_days_ahead' => config('demo.max_days_ahead'),
            'server_now' => now()->toIso8601String(), 'timezone' => 'Asia/Jakarta', 'courts' => $courts,
            'dp_percent' => $setting->dp_percent, 'hold_minutes' => $setting->hold_minutes,
        ]);
    }

    /** Pengaturan pemilik: harga lapangan, DP, dan batas bayar. */
    public function settings(): JsonResponse
    {
        Gate::authorize('owner');
        $setting = Setting::current();

        return response()->json(['courts' => Court::orderBy('id')->get(), 'dp_percent' => $setting->dp_percent, 'hold_minutes' => $setting->hold_minutes]);
    }

    public function updateSettings(Request $request, BookingService $service): JsonResponse
    {
        Gate::authorize('owner');
        $data = $request->validate(['dp_percent' => 'required|integer|min:1|max:100', 'hold_minutes' => 'required|integer|min:5|max:120']);
        $setting = Setting::current();
        $before = $setting->only('dp_percent', 'hold_minutes');
        $setting->update($data);
        $service->audit(null, $request->user(), 'settings_updated', ['before' => $before, 'after' => $data]);

        return response()->json($setting);
    }

    public function store(Request $request, BookingService $service): JsonResponse
    {
        Gate::authorize('owner');
        $court = Court::create($request->validate($this->rules()));
        $service->audit(null, $request->user(), 'court_created', ['court_id' => $court->id]);

        return response()->json($court, 201);
    }

    public function update(Request $request, Court $court, BookingService $service): JsonResponse
    {
        Gate::authorize('owner');
        $data = $request->validate($this->rules(true, $court->id));
        $updated = $service->locked($court->id, function (Court $current) use ($data, $request, $service) {
            $before = $current->toArray();
            $current->fill($data);
            abort_if(! $current->active && Booking::where('court_id', $current->id)->whereIn('status', Booking::HOLDING)->where('ends_at', '>', now())->where('source', '!=', 'block')->exists(), 409, 'Masih ada pesanan aktif di lapangan ini. Selesaikan dulu sebelum menonaktifkan.');
            $current->save();
            $service->audit(null, $request->user(), 'court_updated', ['court_id' => $current->id, 'before' => $before, 'after' => $current->toArray()]);

            return $current;
        });

        return response()->json($updated);
    }

    private function rules(bool $partial = false, ?int $id = null): array
    {
        $required = $partial ? 'sometimes|required' : 'required';

        return ['name' => "$required|string|max:80|unique:courts,name,".($id ?? 'NULL'), 'sport' => "$required|in:futsal,badminton", 'hourly_rate' => "$required|integer|min:1000|max:10000000", 'active' => 'sometimes|boolean'];
    }
}
