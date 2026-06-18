import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { BreadcrumbItem, Event, EventFeedback } from '@/types';
import { CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface Props {
    event: Event & { cover_url?: string };
    existingFeedback: EventFeedback | null;
}

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
    const [hovered, setHovered] = useState(0);
    return (
        <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(star => (
                <button
                    key={star}
                    type="button"
                    disabled={readonly}
                    onMouseEnter={() => !readonly && setHovered(star)}
                    onMouseLeave={() => !readonly && setHovered(0)}
                    onClick={() => !readonly && onChange?.(star)}
                    className={`text-4xl transition-transform focus:outline-none ${!readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
                >
                    <span style={{ color: star <= (hovered || value) ? '#d0b216' : '#d1d5db' }}>★</span>
                </button>
            ))}
        </div>
    );
}

export default function EventFeedbackPage({ event, existingFeedback }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Events', href: '/events' },
        { title: event.title, href: `/events/${event.slug}` },
        { title: 'Feedback', href: `/events/${event.slug}/feedback` },
    ];

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [wouldRecommend, setWouldRecommend] = useState(true);
    const [ratingError, setRatingError] = useState(false);

    function handleSubmit() {
        if (rating === 0) {
            setRatingError(true);
            return;
        }
        setRatingError(false);
        router.post(`/events/${event.slug}/feedback`, {
            rating,
            comment,
            would_recommend: wouldRecommend,
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Feedback — ${event.title}`} />
            <div className="mx-auto w-full max-w-lg px-4 py-8 sm:px-6">

                {existingFeedback ? (
                    /* Thank You State */
                    <Card className="mt-12 text-center">
                        <CardContent className="pt-10 pb-8 space-y-5">
                            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                            <h2 className="font-bold text-2xl">Thank you for your feedback!</h2>

                            <div className="flex justify-center">
                                <StarRating value={existingFeedback.rating} readonly />
                            </div>

                            {existingFeedback.comment && (
                                <p className="italic text-muted-foreground text-sm px-4">
                                    "{existingFeedback.comment}"
                                </p>
                            )}

                            <div className="flex justify-center">
                                {existingFeedback.would_recommend ? (
                                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                                        <CheckCircle className="h-3.5 w-3.5" />
                                        Would recommend: Yes
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground bg-muted border rounded-full px-3 py-1">
                                        Would recommend: No
                                    </span>
                                )}
                            </div>

                            <Link href={`/events/${event.slug}`}>
                                <Button className="mt-2 bg-[#182b5c] hover:bg-[#182b5c]/90 text-white">
                                    Back to Event
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Event Mini-Card */}
                        <div className="flex gap-4 p-4 rounded-xl border bg-muted/30 mb-6">
                            {event.cover_url ? (
                                <img
                                    src={event.cover_url}
                                    alt={event.title}
                                    className="w-24 h-16 rounded-lg object-cover shrink-0"
                                />
                            ) : (
                                <div className="w-24 h-16 rounded-lg shrink-0 bg-gradient-to-br from-[#182b5c] to-[#d0b216]" />
                            )}
                            <div className="min-w-0">
                                <p className="font-bold text-sm leading-tight line-clamp-2">{event.title}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {new Date(event.start_datetime).toLocaleDateString('en-KE', {
                                        weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
                                    })}
                                </p>
                                <p className="text-sm text-muted-foreground">{event.venue}</p>
                            </div>
                        </div>

                        {/* Feedback Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Share Your Experience</CardTitle>
                                <CardDescription>Your feedback helps future attendees</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">

                                {/* Rating */}
                                <div className="space-y-2">
                                    <label className="font-medium text-sm">How would you rate this event?</label>
                                    <StarRating value={rating} onChange={v => { setRating(v); setRatingError(false); }} />
                                    {ratingError && (
                                        <p className="text-destructive text-sm">Please select a rating</p>
                                    )}
                                </div>

                                {/* Comment */}
                                <div className="space-y-2">
                                    <label className="font-medium text-sm">Tell us about your experience</label>
                                    <Textarea
                                        rows={4}
                                        value={comment}
                                        maxLength={1000}
                                        onChange={e => setComment(e.target.value)}
                                        placeholder="Share what you enjoyed or suggestions for improvement..."
                                        className="resize-none"
                                    />
                                    <p className="text-xs text-right text-muted-foreground">{comment.length}/1000</p>
                                </div>

                                {/* Recommend */}
                                <div className="space-y-2">
                                    <label className="font-medium text-sm">Would you recommend this event to others?</label>
                                    <div className="flex items-center gap-3">
                                        <Switch
                                            checked={wouldRecommend}
                                            onCheckedChange={setWouldRecommend}
                                        />
                                        <span className="text-sm text-muted-foreground">
                                            {wouldRecommend ? 'Yes, I would recommend it' : 'No'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="w-full bg-[#d0b216] hover:bg-[#b89d12] text-[#182b5c] font-bold h-12 text-base"
                                >
                                    Submit Feedback
                                </Button>
                            </CardFooter>
                        </Card>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
