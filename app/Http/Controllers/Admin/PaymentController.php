<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function payments(Request $request): Response
    {
        $query = Payment::query()->with(['user:id,name,email', 'order.orderable']);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"))
                  ->orWhere('mpesa_receipt_number', 'like', "%{$search}%")
                  ->orWhere('phone_number', 'like', "%{$search}%");
            });
        }

        $payments = $query->latest()->paginate(20)->withQueryString();

        $payments->getCollection()->transform(function (Payment $p) {
            $p->formatted_amount = $p->formattedAmount();
            $p->orderable_name = $p->order?->orderable?->title ?? $p->order?->orderable?->name ?? '—';
            return $p;
        });

        $statusCounts = [
            'all' => Payment::count(),
            'completed' => Payment::where('status', PaymentStatus::Completed)->count(),
            'pending' => Payment::where('status', PaymentStatus::Pending)->count(),
            'failed' => Payment::where('status', PaymentStatus::Failed)->count(),
        ];

        return Inertia::render('admin/payments/index', [
            'payments' => $payments,
            'filters' => ['status' => $request->input('status', ''), 'search' => $request->input('search', '')],
            'statusCounts' => $statusCounts,
            'totalRevenue' => Payment::where('status', PaymentStatus::Completed)->sum('amount'),
        ]);
    }

    public function orders(Request $request): Response
    {
        $query = Order::query()->with(['user:id,name,email', 'orderable']);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->input('search')) {
            $query->whereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
        }

        $orders = $query->latest()->paginate(20)->withQueryString();

        $orders->getCollection()->transform(function (Order $o) {
            $o->formatted_total = $o->formattedTotal();
            $o->orderable_name = $o->orderable?->title ?? $o->orderable?->name ?? '—';
            return $o;
        });

        $statusCounts = [
            'all' => Order::count(),
            'pending' => Order::where('status', OrderStatus::Pending)->count(),
            'paid' => Order::where('status', OrderStatus::Paid)->count(),
            'fulfilled' => Order::where('status', OrderStatus::Fulfilled)->count(),
            'cancelled' => Order::where('status', OrderStatus::Cancelled)->count(),
        ];

        return Inertia::render('admin/orders/index', [
            'orders' => $orders,
            'filters' => ['status' => $request->input('status', ''), 'search' => $request->input('search', '')],
            'statusCounts' => $statusCounts,
        ]);
    }
}
