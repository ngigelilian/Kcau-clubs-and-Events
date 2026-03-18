import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { BreadcrumbItem, Merchandise } from '@/types';
import { ShoppingBag, ShoppingCart, Edit, Tag, Package } from 'lucide-react';
import { useState, type FormEvent } from 'react';

interface Props {
    merchandise: Merchandise;
    relatedItems: Merchandise[];
}

export default function MerchandiseShow({ merchandise: item, relatedItems }: Props) {
    const { auth } = usePage().props as { auth: { user: { id: number; permissions: string[]; roles: string[] } | null } };
    const user = auth.user;
    const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('super-admin');
    const canEdit = user?.permissions?.includes('merchandise.update') || isAdmin;
    const [quantity, setQuantity] = useState(1);
    const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState((user as { phone?: string | null } | null)?.phone ?? '');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Merchandise', href: '/merchandise' },
        { title: item.name, href: `/merchandise/${item.id}` },
    ];

    const handleOrder = (e: FormEvent) => {
        e.preventDefault();
        setPhoneDialogOpen(true);
    };

    const handleConfirmOrder = (e: FormEvent) => {
        e.preventDefault();

        router.post(
            `/merchandise/${item.id}/order`,
            { quantity, phone_number: phoneNumber || undefined },
            {
                onSuccess: () => setPhoneDialogOpen(false),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={item.name} />
            <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Image */}
                    <div className="w-full md:w-1/2">
                        <div className="aspect-square overflow-hidden rounded-xl bg-muted">
                            {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center">
                                    <ShoppingBag className="h-16 w-16 text-muted-foreground/40" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Details */}
                    <div className="w-full md:w-1/2 space-y-5">
                        <div>
                            {item.club && (
                                <Link href={`/clubs/${item.club.slug}`} className="text-sm text-primary hover:underline">
                                    {item.club.name}
                                </Link>
                            )}
                            <h1 className="text-3xl font-bold tracking-tight mt-1">{item.name}</h1>
                            <div className="flex items-center gap-3 mt-3">
                                <span className="text-3xl font-bold text-primary">{item.formatted_price}</span>
                                {item.status === 'available' ? (
                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">In Stock</Badge>
                                ) : (
                                    <Badge variant="destructive">{item.status === 'out_of_stock' ? 'Out of Stock' : 'Discontinued'}</Badge>
                                )}
                            </div>
                        </div>

                        <Separator />

                        <div className="prose dark:prose-invert max-w-none">
                            <p className="whitespace-pre-wrap text-muted-foreground">{item.description}</p>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Package className="h-4 w-4" />
                            <span>{item.stock_quantity} items remaining</span>
                        </div>

                        {/* Order Form */}
                        {user && item.status === 'available' && item.stock_quantity > 0 && (
                            <form onSubmit={handleOrder} className="space-y-4">
                                <div className="flex items-end gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="quantity">Quantity</Label>
                                        <Input
                                            id="quantity"
                                            type="number"
                                            min={1}
                                            max={item.stock_quantity}
                                            value={quantity}
                                            onChange={(e) => setQuantity(Number(e.target.value))}
                                            className="w-24"
                                        />
                                    </div>
                                    <Button type="submit" size="lg" className="flex-1">
                                        <ShoppingCart className="mr-2 h-4 w-4" />Pay with M-Pesa
                                    </Button>
                                </div>
                            </form>
                        )}

                        <Dialog open={phoneDialogOpen} onOpenChange={setPhoneDialogOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Confirm Payment Details</DialogTitle>
                                    <DialogDescription>
                                        Enter the Safaricom number that will receive the STK push for this order.
                                    </DialogDescription>
                                </DialogHeader>

                                <form onSubmit={handleConfirmOrder} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="merch-phone-number">Phone Number</Label>
                                        <Input
                                            id="merch-phone-number"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="2547XXXXXXXX or 07XXXXXXXX"
                                        />
                                    </div>

                                    <p className="text-sm text-muted-foreground">
                                        Quantity: {quantity} • Total: {(item.price * quantity / 100).toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}
                                    </p>

                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setPhoneDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit">Send STK Push</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {canEdit && (
                            <div className="pt-2">
                                <Link href={`/merchandise/${item.id}/edit`}>
                                    <Button variant="outline" className="w-full">
                                        <Edit className="mr-2 h-4 w-4" />Edit Item
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Related Items */}
                {relatedItems.length > 0 && (
                    <div className="space-y-4 pt-6">
                        <h2 className="text-xl font-bold">More from this Club</h2>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            {relatedItems.map((rel) => (
                                <Link key={rel.id} href={`/merchandise/${rel.id}`} className="group">
                                    <Card className="overflow-hidden transition-all hover:shadow-md">
                                        <div className="aspect-square overflow-hidden bg-muted">
                                            {rel.image_url ? (
                                                <img src={rel.image_url} alt={rel.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                                            ) : (
                                                <div className="flex h-full items-center justify-center">
                                                    <ShoppingBag className="h-8 w-8 text-muted-foreground/40" />
                                                </div>
                                            )}
                                        </div>
                                        <CardContent className="p-3">
                                            <p className="font-medium line-clamp-1 text-sm">{rel.name}</p>
                                            <p className="text-sm font-bold text-primary">{rel.formatted_price}</p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
