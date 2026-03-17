<?php

namespace App\Http\Controllers;

use App\Enums\MerchandiseStatus;
use App\Http\Requests\Payment\InitiateMerchandisePurchaseRequest;
use App\Models\Club;
use App\Models\Merchandise;
use App\Services\MerchandiseService;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MerchandiseController extends Controller
{
    public function __construct(
        private readonly MerchandiseService $merchandiseService,
        private readonly PaymentService $paymentService,
    ) {}

    public function index(Request $request): Response
    {
        $query = Merchandise::query()
            ->with('club:id,name,slug')
            ->where('status', MerchandiseStatus::Available)
            ->where('stock_quantity', '>', 0);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                  ->orWhere('description', 'ILIKE', "%{$search}%");
            });
        }

        if ($clubId = $request->input('club_id')) {
            $query->where('club_id', $clubId);
        }

        $sort = $request->input('sort', 'newest');
        $query = match ($sort) {
            'price_low' => $query->orderBy('price'),
            'price_high' => $query->orderByDesc('price'),
            'name' => $query->orderBy('name'),
            default => $query->latest(),
        };

        $merchandise = $query->paginate(12)->withQueryString();

        $merchandise->getCollection()->transform(function (Merchandise $item) {
            $item->image_urls = $item->getMedia('images')->map->getUrl()->toArray();
            $item->formatted_price = $item->formattedPrice();
            return $item;
        });

        $clubs = Club::active()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('merchandise/index', [
            'merchandise' => $merchandise,
            'filters' => [
                'search' => $request->input('search', ''),
                'club_id' => $request->input('club_id', ''),
                'sort' => $sort,
            ],
            'clubs' => $clubs,
        ]);
    }

    public function show(Merchandise $merchandise): Response
    {
        $this->authorize('view', $merchandise);

        $merchandise->load('club:id,name,slug');
        $merchandise->image_urls = $merchandise->getMedia('images')->map->getUrl()->toArray();
        $merchandise->image_url = $merchandise->image_urls[0] ?? null;
        $merchandise->formatted_price = $merchandise->formattedPrice();
        $merchandise->is_in_stock = $merchandise->isInStock();

        // Related items from same club
        $related = Merchandise::where('club_id', $merchandise->club_id)
            ->where('id', '!=', $merchandise->id)
            ->available()
            ->limit(4)
            ->get();

        $related->transform(function (Merchandise $item) {
            $item->image_urls = $item->getMedia('images')->map->getUrl()->toArray();
            $item->image_url = $item->image_urls[0] ?? null;
            $item->formatted_price = $item->formattedPrice();
            return $item;
        });

        return Inertia::render('merchandise/show', [
            'merchandise' => $merchandise,
            'relatedItems' => $related,
        ]);
    }

    public function create(Club $club): Response
    {
        $this->authorize('manageMerchandise', $club);

        return Inertia::render('merchandise/create', [
            'club' => $club->only('id', 'name', 'slug'),
        ]);
    }

    public function store(Request $request, Club $club)
    {
        $this->authorize('manageMerchandise', $club);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'min:10', 'max:5000'],
            'price' => ['required', 'integer', 'min:100'],
            'stock_quantity' => ['required', 'integer', 'min:1', 'max:10000'],
            'images' => ['nullable', 'array', 'max:5'],
            'images.*' => ['image', 'mimes:jpeg,png,webp', 'max:5120'],
        ]);

        $this->merchandiseService->createItem($club, $validated);

        return to_route('clubs.show', $club)
            ->with('success', 'Merchandise item added successfully.');
    }

    public function edit(Merchandise $merchandise): Response
    {
        $this->authorize('update', $merchandise);

        $merchandise->load('club:id,name,slug');
        $merchandise->image_urls = $merchandise->getMedia('images')->map->getUrl()->toArray();

        return Inertia::render('merchandise/edit', [
            'merchandise' => $merchandise,
        ]);
    }

    public function update(Request $request, Merchandise $merchandise)
    {
        $this->authorize('update', $merchandise);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'min:10', 'max:5000'],
            'price' => ['required', 'integer', 'min:100'],
            'stock_quantity' => ['required', 'integer', 'min:0', 'max:10000'],
            'status' => ['nullable', 'string'],
            'images' => ['nullable', 'array', 'max:5'],
            'images.*' => ['image', 'mimes:jpeg,png,webp', 'max:5120'],
        ]);

        $this->merchandiseService->updateItem($merchandise, $validated);

        return back()->with('success', 'Merchandise updated successfully.');
    }

    public function destroy(Merchandise $merchandise)
    {
        $this->authorize('delete', $merchandise);

        $clubSlug = $merchandise->club->slug;
        $this->merchandiseService->deleteItem($merchandise);

        return to_route('clubs.show', $clubSlug)
            ->with('success', 'Merchandise item deleted.');
    }

    public function order(InitiateMerchandisePurchaseRequest $request, Merchandise $merchandise)
    {
        $this->authorize('purchase', $merchandise);

        try {
            $this->paymentService->initiateMerchandisePurchase(
                $merchandise,
                $request->user(),
                $request->validated('quantity'),
                $request->validated('phone_number'),
            );

            return back()->with('success', 'M-Pesa prompt sent. Complete payment on your phone to confirm this order.');
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
