<?php

namespace App\Services;

use App\Enums\MerchandiseStatus;
use App\Enums\OrderStatus;
use App\Models\Club;
use App\Models\Merchandise;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class MerchandiseService
{
    public function createItem(Club $club, array $data): Merchandise
    {
        return DB::transaction(function () use ($club, $data) {
            $item = Merchandise::create([
                'club_id' => $club->id,
                'name' => $data['name'],
                'description' => $data['description'],
                'price' => $data['price'],
                'stock_quantity' => $data['stock_quantity'],
                'status' => MerchandiseStatus::Available,
            ]);

            if (isset($data['images'])) {
                foreach ($data['images'] as $image) {
                    $item->addMedia($image)->toMediaCollection('images');
                }
            }

            return $item;
        });
    }

    public function updateItem(Merchandise $item, array $data): Merchandise
    {
        return DB::transaction(function () use ($item, $data) {
            $item->update([
                'name' => $data['name'],
                'description' => $data['description'],
                'price' => $data['price'],
                'stock_quantity' => $data['stock_quantity'],
                'status' => $data['status'] ?? $item->status,
            ]);

            if (isset($data['images'])) {
                $item->clearMediaCollection('images');
                foreach ($data['images'] as $image) {
                    $item->addMedia($image)->toMediaCollection('images');
                }
            }

            if ($item->stock_quantity <= 0 && $item->status === MerchandiseStatus::Available) {
                $item->update(['status' => MerchandiseStatus::OutOfStock]);
            }

            return $item->fresh();
        });
    }

    public function placeOrder(Merchandise $item, User $user, int $quantity): Order
    {
        return DB::transaction(function () use ($item, $user, $quantity) {
            if (! $item->isInStock()) {
                throw new \RuntimeException('This item is currently out of stock.');
            }

            if ($item->stock_quantity < $quantity) {
                throw new \RuntimeException("Only {$item->stock_quantity} items available.");
            }

            $order = Order::create([
                'user_id' => $user->id,
                'orderable_type' => Merchandise::class,
                'orderable_id' => $item->id,
                'quantity' => $quantity,
                'unit_price' => $item->price,
                'total_amount' => $item->price * $quantity,
                'status' => OrderStatus::Pending,
            ]);

            // Reserve stock
            $item->decrement('stock_quantity', $quantity);

            if ($item->fresh()->stock_quantity <= 0) {
                $item->update(['status' => MerchandiseStatus::OutOfStock]);
            }

            return $order;
        });
    }

    public function deleteItem(Merchandise $item): void
    {
        $item->clearMediaCollection('images');
        $item->delete();
    }
}
