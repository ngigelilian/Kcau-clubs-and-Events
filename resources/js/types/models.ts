// =========================================================================
// Enum Types — mirror PHP enums
// =========================================================================

export type ClubStatus = 'pending' | 'active' | 'suspended';
export type ClubCategory = 'academic' | 'cultural' | 'sports' | 'religious' | 'technology' | 'social' | 'other';
export type ClubMembershipType = 'free' | 'subscription' | 'hybrid';
export type MembershipRole = 'member' | 'leader' | 'co-leader';
export type MembershipStatus = 'pending' | 'active' | 'rejected';
export type EventType = 'club' | 'school';
export type EventStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
export type RegistrationStatus = 'registered' | 'attended' | 'cancelled';
export type PaymentStatusEnum = 'pending' | 'paid' | 'waived';
export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'cancelled';
export type PaymentStatus = 'initiated' | 'pending' | 'completed' | 'failed';
export type PaymentMethod = 'mpesa';
export type MerchandiseStatus = 'available' | 'out_of_stock' | 'discontinued';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';
export type AnnouncementAudience = 'all_members' | 'all_students' | 'club_members' | 'leaders_only' | 'specific_club';
export type ReportType = 'participation' | 'financial' | 'club_performance' | 'user_activity';
export type ReportStatus = 'pending' | 'processing' | 'completed' | 'failed';

// =========================================================================
// Model Types
// =========================================================================

export interface Club {
    id: number;
    name: string;
    slug: string;
    description: string;
    category: ClubCategory;
    status: ClubStatus;
    created_by: number;
    approved_by: number | null;
    approved_at: string | null;
    max_members: number | null;
    membership_type: ClubMembershipType;
    membership_fee: number | null;
    membership_discount_percent: number | null;
    hybrid_free_faculty: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;

    // Relationships (optional, loaded when needed)
    creator?: import('./auth').User;
    approver?: import('./auth').User;
    memberships?: ClubMembership[];
    events?: Event[];
    merchandise?: Merchandise[];
    announcements?: Announcement[];

    // Computed/aggregated
    active_members_count?: number;
    logo_url?: string;
    banner_url?: string;
}

export interface ClubMembership {
    id: number;
    club_id: number;
    user_id: number;
    role: MembershipRole;
    status: MembershipStatus;
    membership_fee_due: number;
    membership_fee_waived: boolean;
    joined_at: string | null;
    created_at: string;
    updated_at: string;

    // Relationships
    club?: Club;
    user?: import('./auth').User;
}

export interface Event {
    id: number;
    title: string;
    slug: string;
    description: string;
    club_id: number | null;
    type: EventType;
    venue: string;
    start_datetime: string;
    end_datetime: string;
    capacity: number | null;
    registration_deadline: string | null;
    is_paid: boolean;
    fee_amount: number; // in cents
    status: EventStatus;
    created_by: number;
    approved_by: number | null;
    approved_at: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;

    // Relationships
    club?: Club;
    creator?: import('./auth').User;
    approver?: import('./auth').User;
    registrations?: EventRegistration[];

    // Computed
    available_spots?: number | null;
    is_registration_open?: boolean;
    formatted_fee?: string;
    cover_url?: string;
}

export interface EventRegistration {
    id: number;
    event_id: number;
    user_id: number;
    status: RegistrationStatus;
    payment_status: PaymentStatusEnum;
    registered_at: string;
    attended_at: string | null;
    cancelled_at: string | null;
    created_at: string;
    updated_at: string;

    // Relationships
    event?: Event;
    user?: import('./auth').User;
}

export interface Merchandise {
    id: number;
    club_id: number;
    name: string;
    description: string;
    price: number; // in cents
    stock_quantity: number;
    status: MerchandiseStatus;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;

    // Relationships
    club?: Club;

    // Computed
    formatted_price?: string;
    is_in_stock?: boolean;
    image_url?: string;
    image_urls?: string[];
}

export interface Order {
    id: number;
    user_id: number;
    orderable_type: string;
    orderable_id: number;
    quantity: number;
    unit_price: number; // in cents
    total_amount: number; // in cents
    status: OrderStatus;
    mpesa_reference: string | null;
    created_at: string;
    updated_at: string;

    // Relationships
    user?: import('./auth').User;
    orderable?: Event | Merchandise;
    payments?: Payment[];

    // Computed
    formatted_total?: string;
}

export interface Payment {
    id: number;
    order_id: number;
    user_id: number;
    amount: number; // in cents
    phone_number: string;
    mpesa_checkout_request_id: string | null;
    mpesa_receipt_number: string | null;
    status: PaymentStatus;
    payment_method: PaymentMethod;
    paid_at: string | null;
    failed_at: string | null;
    failure_reason: string | null;
    created_at: string;
    updated_at: string;

    // Relationships
    order?: Order;
    user?: import('./auth').User;

    // Computed
    formatted_amount?: string;
}

export interface Announcement {
    id: number;
    club_id: number | null;
    user_id: number;
    title: string;
    body: string;
    content: string;
    audience: AnnouncementAudience;
    is_email: boolean;
    published_at: string | null;
    created_at: string;
    updated_at: string;

    // Relationships
    club?: Club;
    author?: import('./auth').User;
    created_by_user?: import('./auth').User;
}

export interface Ticket {
    id: number;
    user_id: number;
    subject: string;
    description: string;
    message: string;
    status: TicketStatus;
    priority: TicketPriority;
    assigned_to: number | null;
    resolved_at: string | null;
    closed_at: string | null;
    created_at: string;
    updated_at: string;

    // Relationships
    user?: import('./auth').User;
    assignee?: import('./auth').User;
    assigned_to_user?: import('./auth').User;
    replies?: TicketReply[];

    // Computed
    is_overdue?: boolean;
    replies_count?: number;
}

export interface TicketReply {
    id: number;
    ticket_id: number;
    user_id: number;
    message: string;
    is_admin_reply: boolean;
    created_at: string;
    updated_at: string;

    // Relationships
    ticket?: Ticket;
    user?: import('./auth').User;
}

export interface Report {
    id: number;
    type: ReportType;
    generated_by: number;
    parameters: Record<string, unknown> | null;
    file_path: string | null;
    status: ReportStatus;
    created_at: string;
    updated_at: string;

    // Relationships
    generator?: import('./auth').User;
}

// =========================================================================
// Pagination
// =========================================================================

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

// =========================================================================
// Flash Messages
// =========================================================================

export interface FlashMessages {
    success?: string;
    error?: string;
    warning?: string;
}

// =========================================================================
// Shared Page Props
// =========================================================================

export interface SharedPageProps {
    name: string;
    auth: {
        user: import('./auth').User | null;
    };
    sidebarOpen: boolean;
    flash: FlashMessages;
}
