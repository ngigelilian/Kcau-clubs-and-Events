<?php
namespace App\Http\Controllers;
use App\Models\AiKnowledgeBase;
use App\Models\AiChatLog;
use App\Models\Event;
use App\Models\Club;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AiChatController extends Controller
{
    public function chat(Request $request)
    {
        $request->validate(['question' => 'required|string|max:500']);
        $question = trim($request->input('question'));

        // 1. Search knowledge base (case-insensitive keyword match)
        $entry = AiKnowledgeBase::active()
            ->whereRaw('LOWER(question) LIKE ?', ['%' . Str::lower($question) . '%'])
            ->orderByDesc('use_count')
            ->first();

        // If no direct match, try word-by-word (split question into keywords)
        if (!$entry) {
            $words = collect(explode(' ', Str::lower($question)))
                ->filter(fn($w) => strlen($w) > 3)
                ->values();

            $entry = AiKnowledgeBase::active()
                ->where(function ($q) use ($words) {
                    foreach ($words as $word) {
                        $q->orWhereRaw('LOWER(question) LIKE ?', ["%{$word}%"])
                          ->orWhereRaw('LOWER(answer) LIKE ?', ["%{$word}%"]);
                    }
                })
                ->orderByDesc('use_count')
                ->first();
        }

        if ($entry) {
            $entry->increment('use_count');
            $answer = $entry->answer;
            $kbId = $entry->id;
        } else {
            // 2. Try to match with live event/club data
            $answer = $this->generateContextualAnswer($question);
            $kbId = null;
        }

        // Log the chat
        AiChatLog::create([
            'user_id' => $request->user()?->id,
            'question' => $question,
            'answer' => $answer,
            'knowledge_base_id' => $kbId,
        ]);

        return response()->json([
            'answer' => $answer,
            'matched' => $entry !== null,
        ]);
    }

    private function generateContextualAnswer(string $question): string
    {
        $lower = Str::lower($question);
        $greeting = SiteSetting::get('ai_greeting', 'Hello! I\'m the KCAU Events Assistant.');

        // Check for event-related keywords
        if (Str::contains($lower, ['event', 'upcoming', 'happening', 'next', 'schedule'])) {
            $events = Event::upcoming()->with('club:id,name')->orderBy('start_datetime')->take(3)->get();
            if ($events->isEmpty()) {
                return "There are no upcoming events at the moment. Check back soon!";
            }
            $list = $events->map(fn($e) =>
                "• **{$e->title}** — " . $e->start_datetime->format('D, M j g:ia') . " at {$e->venue}"
            )->join("\n");
            return "Here are the next upcoming events:\n\n{$list}\n\nVisit /events for the full list!";
        }

        if (Str::contains($lower, ['club', 'join', 'membership', 'society'])) {
            $clubs = Club::active()->orderBy('name')->take(5)->get();
            $list = $clubs->map(fn($c) => "• **{$c->name}** ({$c->category})")->join("\n");
            return "We have many amazing clubs at KCAU! Here are a few:\n\n{$list}\n\nVisit /clubs to see all clubs and join the ones you love!";
        }

        if (Str::contains($lower, ['register', 'sign up', 'book', 'ticket', 'enroll'])) {
            return "To register for an event:\n1. Go to /events\n2. Click on the event you want to attend\n3. Click **Register Now** (or **Pay & Register** for paid events)\n4. For paid events, you'll receive an M-Pesa STK push\n\nNeed help? Visit our support section!";
        }

        if (Str::contains($lower, ['payment', 'pay', 'mpesa', 'fee', 'cost'])) {
            return "Payments at KCAU Events are processed via **M-Pesa (Daraja API)**.\n\n• Enter your Safaricom number when registering\n• You'll receive an STK push prompt on your phone\n• Complete the payment to confirm your spot\n\nFor payment issues, please raise a support ticket.";
        }

        if (Str::contains($lower, ['cancel', 'refund', 'withdraw'])) {
            return "You can cancel your event registration before the event starts by visiting the event page and clicking **Cancel Registration**. Refund policies vary per event — check the event description for details.";
        }

        if (Str::contains($lower, ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'help'])) {
            return "{$greeting}\n\nI can help you with:\n• 🎉 Finding upcoming events\n• 🏛️ Discovering clubs to join\n• 💳 Event registration & payments\n• 📅 Your schedule & bookmarks\n• ❓ Any other campus activity questions\n\nWhat would you like to know?";
        }

        return "I'm not sure about that one! Here's what I can help with:\n\n• **Events** — What's happening on campus\n• **Clubs** — How to join and participate\n• **Payments** — M-Pesa registration process\n• **Your account** — Registration, cancellations\n\nTry asking something like \"What events are happening this week?\" or \"How do I join a club?\"";
    }

    public function getSuggestions()
    {
        $suggestions = [
            'What events are happening this week?',
            'How do I join a club?',
            'How do I pay for an event?',
            'Can I cancel my registration?',
            'What clubs are available?',
            'How do I get my check-in QR code?',
        ];
        return response()->json(['suggestions' => $suggestions]);
    }

    public function rateFeedback(Request $request, AiChatLog $log)
    {
        $request->validate(['helpful' => 'required|boolean']);
        $log->update(['was_helpful' => $request->boolean('helpful')]);
        return response()->json(['ok' => true]);
    }
}
