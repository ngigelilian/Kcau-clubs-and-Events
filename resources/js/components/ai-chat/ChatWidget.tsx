import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, ChevronDown } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    logId?: number;
}

export default function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [unread, setUnread] = useState(0);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load suggestions on mount
    useEffect(() => {
        fetch('/api/ai/suggestions')
            .then((r) => r.json())
            .then((d) => setSuggestions(d.suggestions ?? []))
            .catch(() => {
                setSuggestions([
                    'What events are happening this week?',
                    'How do I join a club?',
                    'How do I pay for an event?',
                    'How do I earn points?',
                ]);
            });
    }, []);

    // Show welcome message when opening first time
    useEffect(() => {
        if (open && messages.length === 0) {
            setMessages([
                {
                    id: 'welcome',
                    role: 'assistant',
                    content:
                        "👋 Hi! I'm the **KCAU Events Assistant**.\n\nI can help you find events, learn about clubs, understand payment processes, and answer any campus activity questions.\n\nWhat would you like to know?",
                },
            ]);
        }
    }, [open]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (text?: string) => {
        const q = (text ?? input).trim();
        if (!q || loading) return;
        setInput('');

        const userMsg: Message = { id: Math.random().toString(36), role: 'user', content: q };
        setMessages((prev) => [...prev, userMsg]);
        setLoading(true);

        try {
            const csrf =
                document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    Accept: 'application/json',
                },
                body: JSON.stringify({ question: q }),
            });
            const data = await res.json();
            const botMsg: Message = {
                id: Math.random().toString(36),
                role: 'assistant',
                content:
                    data.answer ?? "Sorry, I couldn't find an answer. Please try again!",
                logId: data.log_id,
            };
            setMessages((prev) => [...prev, botMsg]);
            if (!open) setUnread((u) => u + 1);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: Math.random().toString(36),
                    role: 'assistant',
                    content: 'Oops! Something went wrong. Please try again.',
                },
            ]);
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const renderContent = (text: string) => {
        return text.split('\n').map((line, i) => {
            const parts = line.split(/\*\*(.*?)\*\*/g);
            return (
                <p key={i} className={`${i > 0 ? 'mt-1' : ''} ${line.startsWith('•') ? 'pl-2' : ''}`}>
                    {parts.map((p, j) =>
                        j % 2 === 1 ? <strong key={j}>{p}</strong> : p,
                    )}
                </p>
            );
        });
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => {
                    setOpen(true);
                    setUnread(0);
                }}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#182b5c] text-white px-4 py-3 rounded-full shadow-2xl hover:bg-[#0f1e42] transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ display: open ? 'none' : 'flex' }}
                aria-label="Open AI chat"
            >
                <Bot className="h-5 w-5 text-[#d0b216]" />
                <span className="text-sm font-medium">Ask KCAU AI</span>
                {unread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {unread}
                    </span>
                )}
            </button>

            {/* Chat Window */}
            {open && (
                <div className="fixed bottom-6 right-6 z-50 flex flex-col w-[380px] max-h-[600px] bg-background border border-border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="bg-[#182b5c] px-4 py-3 flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-2 flex-1">
                            <div className="w-8 h-8 rounded-full bg-[#d0b216] flex items-center justify-center shrink-0">
                                <Bot className="h-4 w-4 text-[#182b5c]" />
                            </div>
                            <div>
                                <p className="text-white text-sm font-semibold">KCAU AI Assistant</p>
                                <p className="text-white/60 text-xs flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                                    Online · Always here to help
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setMinimized(!minimized)}
                            className="text-white/60 hover:text-white transition"
                            aria-label={minimized ? 'Expand' : 'Minimize'}
                        >
                            <ChevronDown
                                className={`h-4 w-4 transition-transform ${minimized ? 'rotate-180' : ''}`}
                            />
                        </button>
                        <button
                            onClick={() => setOpen(false)}
                            className="text-white/60 hover:text-white transition"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {!minimized && (
                        <>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px]">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {msg.role === 'assistant' && (
                                            <div className="w-7 h-7 rounded-full bg-[#182b5c] flex items-center justify-center shrink-0 mt-0.5">
                                                <Bot className="h-3.5 w-3.5 text-[#d0b216]" />
                                            </div>
                                        )}
                                        <div
                                            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                                                msg.role === 'user'
                                                    ? 'bg-[#182b5c] text-white rounded-tr-sm'
                                                    : 'bg-muted text-foreground rounded-tl-sm'
                                            }`}
                                        >
                                            {renderContent(msg.content)}
                                        </div>
                                    </div>
                                ))}

                                {loading && (
                                    <div className="flex gap-2 items-center">
                                        <div className="w-7 h-7 rounded-full bg-[#182b5c] flex items-center justify-center shrink-0">
                                            <Bot className="h-3.5 w-3.5 text-[#d0b216]" />
                                        </div>
                                        <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
                                            {[0, 1, 2].map((i) => (
                                                <span
                                                    key={i}
                                                    className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                                                    style={{ animationDelay: `${i * 0.15}s` }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div ref={bottomRef} />
                            </div>

                            {/* Suggestions */}
                            {messages.length <= 1 && suggestions.length > 0 && (
                                <div className="px-4 pb-2 shrink-0">
                                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                        <Sparkles className="h-3 w-3 text-[#d0b216]" />
                                        Suggested questions
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {suggestions.slice(0, 4).map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => sendMessage(s)}
                                                className="text-xs bg-[#182b5c]/8 border border-[#182b5c]/20 text-[#182b5c] dark:text-blue-300 dark:border-blue-800 dark:bg-blue-950/30 px-2.5 py-1 rounded-full hover:bg-[#182b5c]/15 transition"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Input */}
                            <div className="border-t p-3 flex gap-2 shrink-0">
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                    placeholder="Ask anything about events or clubs..."
                                    className="flex-1 text-sm bg-muted rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#182b5c]/30 placeholder:text-muted-foreground"
                                />
                                <button
                                    onClick={() => sendMessage()}
                                    disabled={!input.trim() || loading}
                                    className="w-9 h-9 rounded-xl bg-[#182b5c] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#0f1e42] transition shrink-0"
                                    aria-label="Send"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                            <p className="text-center text-xs text-muted-foreground pb-2 shrink-0">
                                Powered by KCAU AI ·{' '}
                                <a href="/tickets/create" className="underline hover:text-foreground">
                                    Get human support
                                </a>
                            </p>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
