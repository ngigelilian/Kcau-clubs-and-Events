import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import type { Club } from '@/types';
import { Users } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { show } from '@/routes/clubs';
import { clubCategoryBadge } from '@/lib/color-badges';

interface ClubCardProps {
    club: Club;
}

export default function ClubCard({ club }: ClubCardProps) {
    const categoryLabel = club.category.charAt(0).toUpperCase() + club.category.slice(1);

    return (
        <Link href={show.url(club.slug)}>
            <Card className="group h-full overflow-hidden transition-shadow hover:shadow-md">
                {/* Banner */}
                <div className="relative h-32 w-full overflow-hidden bg-muted">
                    {club.banner_url ? (
                        <img
                            src={club.banner_url}
                            alt={`${club.name} banner`}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-primary/70">
                            {club.logo_url ? (
                                <img
                                    src={club.logo_url}
                                    alt={club.name}
                                    className="h-16 w-16 rounded-full object-cover"
                                />
                            ) : (
                                <span className="text-3xl font-bold text-primary-foreground/70">
                                    {club.name.charAt(0)}
                                </span>
                            )}
                        </div>
                    )}
                    <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className={clubCategoryBadge(club.category)}>
                            {categoryLabel}
                        </Badge>
                    </div>
                </div>

                <CardContent className="flex-1 px-4 pt-3 pb-0">
                    <div className="flex items-start gap-3">
                        {club.logo_url && club.banner_url ? (
                            <img
                                src={club.logo_url}
                                alt={club.name}
                                className="h-10 w-10 shrink-0 rounded-full border-2 border-background object-cover"
                            />
                        ) : null}
                        <div className="min-w-0">
                            <h3 className="truncate font-semibold text-foreground group-hover:text-primary dark:group-hover:text-accent">
                                {club.name}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                {club.description}
                            </p>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex items-center justify-between px-4 pt-0 pb-3">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{club.active_members_count ?? 0} members</span>
                    </div>
                    {club.max_members && (
                        <span className="text-xs text-muted-foreground">
                            Max {club.max_members}
                        </span>
                    )}
                </CardFooter>
            </Card>
        </Link>
    );
}