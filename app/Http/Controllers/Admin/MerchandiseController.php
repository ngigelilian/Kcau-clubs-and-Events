<?php

namespace App\Http\Controllers\Admin;

use App\Enums\MerchandiseStatus;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Merchandise;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MerchandiseController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Merchandise::query()->with('club:id,name')->withCount('orders');

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $merchandise = $query->latest()->paginate(20)->withQueryString();

        $merchandise->getCollection()->transform(function (Merchandise $m) {
            $m->formatted_price = $m->formattedPrice();
            $m->image_url = $m->getFirstMediaUrl('images');
            return $m;
        });

        return Inertia::render('admin/merchandise/index', [
            'merchandise' => $merchandise,
            'filters' => ['search' => $request->input('search', ''), 'status' => $request->input('status', '')],
            'statusCounts' => [
                'all' => Merchandise::count(),
                'available' => Merchandise::where('status', MerchandiseStatus::Available)->count(),
                'out_of_stock' => Merchandise::where('status', MerchandiseStatus::OutOfStock)->count(),
                'discontinued' => Merchandise::where('status', MerchandiseStatus::Discontinued)->count(),
            ],
        ]);
    }

    public function orders(Request $request): Response
    {
        $query = Order::query()
            ->where('orderable_type', Merchandise::class)
            ->with(['user:id,name,email', 'orderable']);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $orders = $query->latest()->paginate(20)->withQueryString();

        $orders->getCollection()->transform(function (Order $o) {
            $o->formatted_total = $o->formattedTotal();
            $o->orderable_name = $o->orderable?->name ?? '—';
            return $o;
        });

        return Inertia::render('admin/merchandise/orders', [
            'orders' => $orders,
            'filters' => ['status' => $request->input('status', '')],
            'statusCounts' => [
                'all' => Order::where('orderable_type', Merchandise::class)->count(),
                'pending' => Order::where('orderable_type', Merchandise::class)->where('status', OrderStatus::Pending)->count(),
                'paid' => Order::where('orderable_type', Merchandise::class)->where('status', OrderStatus::Paid)->count(),
                'fulfilled' => Order::where('orderable_type', Merchandise::class)->where('status', OrderStatus::Fulfilled)->count(),
            ],
        ]);
    }

    public function fulfillOrder(Order $order)
    {
        if ($order->status !== OrderStatus::Paid) {
            return back()->with('error', 'Only paid orders can be fulfilled.');
        }

        $order->update(['status' => OrderStatus::Fulfilled]);

        return back()->with('success', 'Order marked as fulfilled.');
    }
}
