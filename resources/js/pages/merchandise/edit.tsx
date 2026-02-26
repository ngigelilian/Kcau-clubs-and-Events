import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { BreadcrumbItem, Merchandise } from '@/types';
import { type FormEvent } from 'react';

interface Props {
    merchandise: Merchandise;
}

export default function MerchandiseEdit({ merchandise: item }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Merchandise', href: '/merchandise' },
        { title: item.name, href: `/merchandise/${item.id}` },
        { title: 'Edit', href: '#' },
    ];

    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT' as const,
        name: item.name,
        description: item.description,
        price: item.price,
        stock_quantity: item.stock_quantity,
        images: [] as File[],
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(`/merchandise/${item.id}`, { forceFormData: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit - ${item.name}`} />
            <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Merchandise</h1>
                    <p className="text-muted-foreground">Update item details</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Item Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <Textarea id="description" value={data.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('description', e.target.value)} rows={4} />
                                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Price (cents) *</Label>
                                    <Input id="price" type="number" value={data.price} onChange={(e) => setData('price', e.target.value)} />
                                    {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stock_quantity">Stock *</Label>
                                    <Input id="stock_quantity" type="number" value={data.stock_quantity} onChange={(e) => setData('stock_quantity', e.target.value)} />
                                    {errors.stock_quantity && <p className="text-sm text-destructive">{errors.stock_quantity}</p>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="images">Product Images (replace existing)</Label>
                                {item.image_url && <img src={item.image_url} alt="Current" className="h-24 w-24 rounded-lg object-cover" />}
                                <Input id="images" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setData('images', Array.from(e.target.files || []))} />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
                        <Button type="submit" disabled={processing}>{processing ? 'Saving...' : 'Save Changes'}</Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
