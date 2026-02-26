import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';
import { index, store } from '@/routes/clubs';
import { type FormEvent } from 'react';

interface Category {
    value: string;
    label: string;
}

interface Props {
    categories: Category[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Clubs', href: index.url() },
    { title: 'Propose a Club', href: '#' },
];

export default function ClubCreate({ categories }: Props) {
    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        description: string;
        category: string;
        max_members: string;
        logo: File | null;
        banner: File | null;
    }>({
        name: '',
        description: '',
        category: '',
        max_members: '',
        logo: null,
        banner: null,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(store.url(), {
            forceFormData: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Propose a Club" />

            <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Propose a New Club</CardTitle>
                        <CardDescription>
                            Fill in the details below to propose a new club. An admin will review
                            and approve your proposal. Once approved, you'll be assigned as the club leader.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Club Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Club Name *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g. KCAU Tech Society"
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name}</p>
                                )}
                            </div>

                            {/* Category */}
                            <div className="space-y-2">
                                <Label htmlFor="category">Category *</Label>
                                <Select value={data.category} onValueChange={(v) => setData('category', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((c) => (
                                            <SelectItem key={c.value} value={c.value}>
                                                {c.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.category && (
                                    <p className="text-sm text-destructive">{errors.category}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <Textarea
                                    id="description"
                                    rows={5}
                                    value={data.description}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('description', e.target.value)}
                                    placeholder="Describe the club's mission, goals, and planned activities..."
                                />
                                <p className="text-xs text-muted-foreground">
                                    Minimum 20 characters. Be descriptive to help admins understand your club's purpose.
                                </p>
                                {errors.description && (
                                    <p className="text-sm text-destructive">{errors.description}</p>
                                )}
                            </div>

                            {/* Max Members */}
                            <div className="space-y-2">
                                <Label htmlFor="max_members">Maximum Members (optional)</Label>
                                <Input
                                    id="max_members"
                                    type="number"
                                    min={5}
                                    max={1000}
                                    value={data.max_members}
                                    onChange={(e) => setData('max_members', e.target.value)}
                                    placeholder="Leave blank for unlimited"
                                />
                                {errors.max_members && (
                                    <p className="text-sm text-destructive">{errors.max_members}</p>
                                )}
                            </div>

                            {/* Logo Upload */}
                            <div className="space-y-2">
                                <Label htmlFor="logo">Club Logo (optional)</Label>
                                <Input
                                    id="logo"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) => setData('logo', e.target.files?.[0] ?? null)}
                                />
                                <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP. Max 5MB.</p>
                                {errors.logo && (
                                    <p className="text-sm text-destructive">{errors.logo}</p>
                                )}
                            </div>

                            {/* Banner Upload */}
                            <div className="space-y-2">
                                <Label htmlFor="banner">Banner Image (optional)</Label>
                                <Input
                                    id="banner"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) => setData('banner', e.target.files?.[0] ?? null)}
                                />
                                <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP. Max 5MB. Recommended: 1200×400px.</p>
                                {errors.banner && (
                                    <p className="text-sm text-destructive">{errors.banner}</p>
                                )}
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Submitting...' : 'Submit Proposal'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
