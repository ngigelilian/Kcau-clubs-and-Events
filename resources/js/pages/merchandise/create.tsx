import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { BreadcrumbItem } from '@/types';
import { type FormEvent } from 'react';

interface Props {
    club: { id: number; name: string; slug: string; };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Merchandise', href: '/merchandise' },
    { title: 'Add Item', href: '#' },
];

export default function MerchandiseCreate({ club }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        price: '' as string | number,
        stock_quantity: '' as string | number,
        images: [] as File[],
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(`/clubs/${club.slug}/merchandise`, { forceFormData: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Merchandise" />
            <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Add Merchandise</h1>
                    <p className="text-muted-foreground">Add a new item for {club.name}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Item Details</CardTitle>
                            <CardDescription>Enter the merchandise information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Club T-Shirt" />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <Textarea id="description" value={data.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('description', e.target.value)} rows={4} placeholder="Describe the item..." />
                                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Price (cents) *</Label>
                                    <Input id="price" type="number" value={data.price} onChange={(e) => setData('price', e.target.value)} placeholder="e.g. 150000 = KES 1,500" />
                                    {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                                    <Input id="stock_quantity" type="number" value={data.stock_quantity} onChange={(e) => setData('stock_quantity', e.target.value)} placeholder="e.g. 50" />
                                    {errors.stock_quantity && <p className="text-sm text-destructive">{errors.stock_quantity}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="images">Product Images</Label>
                                <Input id="images" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setData('images', Array.from(e.target.files || []))} />
                                {errors.images && <p className="text-sm text-destructive">{errors.images}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
                        <Button type="submit" disabled={processing}>{processing ? 'Creating...' : 'Add Item'}</Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
