<?php
namespace App\Http\Controllers;
use App\Models\Event;
use App\Models\EventBookmark;
use Illuminate\Http\Request;

class EventBookmarkController extends Controller
{
    public function toggle(Request $request, Event $event)
    {
        $user = $request->user();
        $bookmark = EventBookmark::where('user_id', $user->id)->where('event_id', $event->id)->first();
        if ($bookmark) {
            $bookmark->delete();
            return response()->json(['bookmarked' => false]);
        }
        EventBookmark::create(['user_id' => $user->id, 'event_id' => $event->id]);
        return response()->json(['bookmarked' => true]);
    }

    public function index(Request $request)
    {
        $bookmarks = EventBookmark::where('user_id', $request->user()->id)
            ->with(['event' => fn($q) => $q->with('club:id,name,slug')])
            ->latest()
            ->paginate(12);

        $bookmarks->getCollection()->transform(function ($b) {
            $b->event->cover_url = $b->event->getFirstMediaUrl('cover');
            $b->event->formatted_fee = $b->event->is_paid ? $b->event->formattedFee() : 'Free';
            return $b;
        });

        return inertia('student/bookmarks', ['bookmarks' => $bookmarks]);
    }
}
