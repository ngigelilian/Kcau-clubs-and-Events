export type User = {
    id: number;
    name: string;
    student_id: string | null;
    email: string;
    avatar?: string;
    phone: string | null;
    gender: 'male' | 'female' | 'other' | null;
    department: string | null;
    year_of_study: number | null;
    email_verified_at: string | null;
    is_active: boolean;
    two_factor_enabled?: boolean;
    roles: string[];
    permissions: string[];
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
