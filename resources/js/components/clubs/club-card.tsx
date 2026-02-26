import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import type { Club } from '@/types';
import { Users } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { show } from '@/routes/clubs';

interface ClubCardProps {
    club: Club;
}

const categoryColors: Record<string, string> = {
    academic: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    cultural: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    sports: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    religious: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    technology: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
    social: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

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
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#182b5c] to-[#2a4a8c]">
                            {club.logo_url ? (
                                <img
                                    src={club.logo_url}
                                    alt={club.name}
                                    className="h-16 w-16 rounded-full object-cover"
                                />
                            ) : (
                                <span className="text-3xl font-bold text-white/70">
                                    {club.name.charAt(0)}
                                </span>
                            )}
                        </div>
                    )}
                    <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className={categoryColors[club.category] ?? categoryColors.other}>
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
                            <h3 className="truncate font-semibold text-foreground group-hover:text-[#182b5c] dark:group-hover:text-[#d0b216]">
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
