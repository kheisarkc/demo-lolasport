<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ReportController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        Gate::authorize('owner');
        $data = $request->validate(['from' => 'nullable|date_format:Y-m-d', 'to' => 'nullable|date_format:Y-m-d|after_or_equal:from']);
        $from = CarbonImmutable::parse($data['from'] ?? now('Asia/Jakarta')->startOfMonth()->format('Y-m-d'), 'Asia/Jakarta');
        $to = CarbonImmutable::parse($data['to'] ?? now('Asia/Jakarta')->format('Y-m-d'), 'Asia/Jakarta');
        $payments = Payment::with('booking.court', 'booking.payments')->where('status', 'approved')->where('reviewed_at', '>=', $from->utc())->where('reviewed_at', '<', $to->addDay()->utc())->orderByDesc('reviewed_at')->get();
        $totalsByKind = ['dp' => 0, 'settlement' => 0, 'full' => 0];
        foreach ($payments as $payment) {
            $first = $payment->booking->payments->where('status', 'approved')->sortBy([['reviewed_at', 'asc'], ['id', 'asc']])->first();
            $kind = $first->id !== $payment->id ? 'settlement' : ($payment->amount >= $payment->booking->total ? 'full' : 'dp');
            $payment->setAttribute('kind', $kind);
            $totalsByKind[$kind] += $payment->amount;
        }
        $group = fn (string $format) => $payments->groupBy(fn (Payment $p) => $p->reviewed_at->setTimezone('Asia/Jakarta')->format($format))->map(fn ($items, $period) => ['period' => $period, 'total' => (int) $items->sum('amount'), 'count' => $items->count()])->sortBy('period')->values();

        return response()->json(['label' => 'Penerimaan pembayaran', 'from' => $from->format('Y-m-d'), 'to' => $to->format('Y-m-d'), 'timezone' => 'Asia/Jakarta', 'total' => (int) $payments->sum('amount'), 'totals_by_kind' => $totalsByKind, 'count' => $payments->count(), 'daily' => $group('Y-m-d'), 'monthly' => $group('Y-m'), 'transactions' => $payments]);
    }
}
