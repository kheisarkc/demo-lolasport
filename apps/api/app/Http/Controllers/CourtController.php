<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Court;
use App\Services\BookingService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class CourtController extends Controller
{
    public function index(Request $request, BookingService $service): JsonResponse
    {
        $data = $request->validate(['date' => 'nullable|date_format:Y-m-d']);
        $date = $data['date'] ?? now('Asia/Jakarta')->format('Y-m-d');
        $service->expire();
        $courts = Court::where('active', true)->orderBy('id')->get()->map(function (Court $court) use ($date) {
            $day = CarbonImmutable::parse($date, 'Asia/Jakarta');
            $busy = Booking::where('court_id', $court->id)->whereIn('status', Booking::HOLDING)->where('starts_at', '<', $day->addDay()->utc())->where('ends_at', '>', $day->utc())->get();
            $slots = [];
            for ($hour = $court->open_hour; $hour < $court->close_hour; $hour++) {
                $start = $day->setHour($hour)->utc();
                $end = $start->addHour();
                $available = $start->isFuture() && ! $busy->contains(fn (Booking $b) => $b->starts_at->lt($end) && $b->ends_at->gt($start));
                $slots[] = ['hour' => $hour, 'available' => $available];
            }

            return [...$court->toArray(), 'slots' => $slots];
        });

        return response()->json(['date' => $date, 'timezone' => 'Asia/Jakarta', 'courts' => $courts, 'dp_percent' => config('demo.dp_percent'), 'hold_minutes' => config('demo.hold_minutes')]);
    }

    public function all(): JsonResponse
    {
        Gate::authorize('staff');

        return response()->json(Court::orderBy('id')->get());
    }

    public function store(Request $request, BookingService $service): JsonResponse
    {
        Gate::authorize('staff');
        $data = $request->validate($this->rules());
        if ($data['open_hour'] >= $data['close_hour']) {
            throw ValidationException::withMessages(['close_hour' => 'Jam tutup harus setelah jam buka.']);
        }
        $court = Court::create($data);
        $service->audit(null, $request->user(), 'court_created', ['court_id' => $court->id]);

        return response()->json($court, 201);
    }

    public function update(Request $request, Court $court, BookingService $service): JsonResponse
    {
        Gate::authorize('staff');
        $data = $request->validate($this->rules(true, $court->id));
        $updated = $service->locked($court->id, function (Court $current) use ($data, $request, $service) {
            $before = $current->toArray();
            $current->fill($data);
            if ($current->open_hour >= $current->close_hour) {
                throw ValidationException::withMessages(['close_hour' => 'Jam tutup harus setelah jam buka.']);
            }
            foreach (Booking::where('court_id', $current->id)->whereIn('status', Booking::HOLDING)->where('ends_at', '>', now())->get() as $booking) {
                abort_if(! $current->active || $booking->starts_at->setTimezone('Asia/Jakarta')->hour < $current->open_hour || $booking->ends_at->setTimezone('Asia/Jakarta')->hour > $current->close_hour, 409, 'Perubahan mematahkan jadwal yang sudah terpesan.');
            }
            $current->save();
            $service->audit(null, $request->user(), 'court_updated', ['court_id' => $current->id, 'before' => $before, 'after' => $current->toArray()]);

            return $current;
        });

        return response()->json($updated);
    }

    private function rules(bool $partial = false, ?int $id = null): array
    {
        $required = $partial ? 'sometimes|required' : 'required';

        return ['name' => "$required|string|max:80|unique:courts,name,".($id ?? 'NULL'), 'sport' => "$required|in:futsal,badminton", 'hourly_rate' => "$required|integer|min:1|max:10000000", 'open_hour' => "$required|integer|min:0|max:22", 'close_hour' => "$required|integer|min:1|max:23", 'active' => 'sometimes|boolean'];
    }
}
