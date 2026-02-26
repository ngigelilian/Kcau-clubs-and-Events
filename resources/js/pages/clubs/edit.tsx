import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem, Club } from '@/types';
import { index, show, update } from '@/routes/clubs';
import { type FormEvent } from 'react';

interface Category {
    value: string;
    label: string;
}

interface Props {
    club: Club;
    categories: Category[];
}

export default function ClubEdit({ club, categories }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Clubs', href: index.url() },
        { title: club.name, href: show.url(club.slug) },
        { title: 'Edit', href: '#' },
    ];

    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        description: string;
        category: string;
        max_members: string;
        logo: File | null;
        banner: File | null;
        _method: string;
    }>({
        name: club.name,
        description: club.description,
        category: club.category,
        max_members: club.max_members?.toString() ?? '',
        logo: null,
        banner: null,
        _method: 'PUT',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(update.url(club.slug), {
            forceFormData: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${club.name}`} />

            <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Club</CardTitle>
                        <CardDescription>
                            Update your club's details. Changes are saved immediately.
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
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
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
                                {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <Textarea
                                    id="description"
                                    rows={5}
                                    value={data.description}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('description', e.target.value)}
                                />
                                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
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
                                {errors.max_members && <p className="text-sm text-destructive">{errors.max_members}</p>}
                            </div>

                            {/* Current Logo */}
                            <div className="space-y-2">
                                <Label htmlFor="logo">Club Logo</Label>
                                {club.logo_url && (
                                    <div className="mb-2">
                                        <img src={club.logo_url} alt="Current logo" className="h-16 w-16 rounded-lg object-cover" />
                                        <p className="mt-1 text-xs text-muted-foreground">Current logo — upload a new one to replace.</p>
                                    </div>
                                )}
                                <Input
                                    id="logo"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) => setData('logo', e.target.files?.[0] ?? null)}
                                />
                                {errors.logo && <p className="text-sm text-destructive">{errors.logo}</p>}
                            </div>

                            {/* Current Banner */}
                            <div className="space-y-2">
                                <Label htmlFor="banner">Banner Image</Label>
                                {club.banner_url && (
                                    <div className="mb-2">
                                        <img src={club.banner_url} alt="Current banner" className="h-24 w-full rounded-lg object-cover" />
                                        <p className="mt-1 text-xs text-muted-foreground">Current banner — upload a new one to replace.</p>
                                    </div>
                                )}
                                <Input
                                    id="banner"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) => setData('banner', e.target.files?.[0] ?? null)}
                                />
                                {errors.banner && <p className="text-sm text-destructive">{errors.banner}</p>}
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
