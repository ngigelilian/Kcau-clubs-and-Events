<?php

namespace App\Http\Controllers;

use App\Http\Requests\Payment\ProcessMpesaCallbackRequest;
use App\Models\Order;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaymentService $paymentService,
    ) {}

    public function orders(Request $request): Response
    {
        $orders = Order::query()
            ->where('user_id', $request->user()->id)
            ->with(['orderable', 'payments' => fn ($query) => $query->latest()])
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $orders->getCollection()->transform(function (Order $order) {
            $order->formatted_total = $order->formattedTotal();
            $order->latest_payment = $order->payments->first();
            $order->orderable_name = $order->orderable->title ?? $order->orderable->name ?? 'Order item';

            return $order;
        });

        return Inertia::render('orders/index', [
            'orders' => $orders,
        ]);
    }

    public function payments(Request $request): Response
    {
        $payments = Payment::query()
            ->where('user_id', $request->user()->id)
            ->with(['order.orderable'])
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $payments->getCollection()->transform(function (Payment $payment) {
            $payment->formatted_amount = $payment->formattedAmount();
            $payment->orderable_name = $payment->order?->orderable?->title ?? $payment->order?->orderable?->name ?? 'Order item';

            return $payment;
        });

        return Inertia::render('payments/index', [
            'payments' => $payments,
        ]);
    }

    public function callback(ProcessMpesaCallbackRequest $request): JsonResponse
    {
        try {
            $this->paymentService->handleMpesaCallback($request->validated());
        } catch (\Throwable $exception) {
            Log::error('M-Pesa callback processing failed.', [
                'message' => $exception->getMessage(),
                'payload' => $request->all(),
            ]);
        }

        return response()->json([
            'ResultCode' => 0,
            'ResultDesc' => 'Accepted',
        ]);
    }
}