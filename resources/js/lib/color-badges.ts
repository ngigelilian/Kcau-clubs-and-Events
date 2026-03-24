export const badgeTone = {
    neutral: 'bg-muted text-muted-foreground',
    info: 'bg-info/15 text-info dark:bg-info/25 dark:text-info',
    success: 'bg-success/15 text-success dark:bg-success/25 dark:text-success',
    warning: 'bg-warning/15 text-warning dark:bg-warning/25 dark:text-warning',
    accent: 'bg-accent/15 text-accent-foreground dark:bg-accent/25 dark:text-accent-foreground',
    destructive: 'bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive',
};

export function eventStatusBadge(status: string) {
    const map: Record<string, string> = {
        approved: badgeTone.success,
        pending: badgeTone.warning,
        completed: badgeTone.info,
        cancelled: badgeTone.destructive,
        rejected: badgeTone.destructive,
        draft: badgeTone.neutral,
    };

    return map[status] || badgeTone.neutral;
}

export function ticketStatusBadge(status: string) {
    const map: Record<string, string> = {
        open: badgeTone.warning,
        in_progress: badgeTone.info,
        resolved: badgeTone.success,
        closed: badgeTone.neutral,
    };

    return map[status] || badgeTone.neutral;
}

export function ticketPriorityBadge(priority: string) {
    const map: Record<string, string> = {
        low: badgeTone.neutral,
        medium: badgeTone.info,
        high: badgeTone.warning,
        urgent: badgeTone.destructive,
    };

    return map[priority] || badgeTone.neutral;
}

export function announcementAudienceBadge(audience: string) {
    const map: Record<string, string> = {
        all_students: badgeTone.info,
        club_members: badgeTone.accent,
        leaders_only: badgeTone.warning,
    };

    return map[audience] || badgeTone.neutral;
}

export function clubCategoryBadge(category: string) {
    const map: Record<string, string> = {
        academic: badgeTone.info,
        cultural: badgeTone.accent,
        sports: badgeTone.success,
        religious: badgeTone.warning,
        technology: badgeTone.info,
        social: badgeTone.accent,
        other: badgeTone.neutral,
    };

    return map[category] || badgeTone.neutral;
}
