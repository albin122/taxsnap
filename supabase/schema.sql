-- Supabase SQL Schema Migration File for TaxSnap Engine
-- Execute this script in your Supabase Project -> SQL Editor

-- 1. Table for User Profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
    email VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    dob VARCHAR(50),
    phone VARCHAR(50),
    school_office VARCHAR(255),
    position VARCHAR(255),
    pan VARCHAR(10),
    completed_onboarding BOOLEAN DEFAULT FALSE,
    full_profile JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read user_profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert user_profiles" ON public.user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update user_profiles" ON public.user_profiles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete user_profiles" ON public.user_profiles FOR DELETE USING (true);


-- 2. Table for Tax Computations
CREATE TABLE IF NOT EXISTS public.tax_computations (
    id VARCHAR(255) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pan VARCHAR(10),
    name VARCHAR(255),
    designation VARCHAR(255),
    office_name VARCHAR(255),
    place VARCHAR(255),
    gross_income NUMERIC(12, 2),
    taxable_income NUMERIC(12, 2),
    total_tax_liability NUMERIC(12, 2),
    net_payable_or_refund NUMERIC(12, 2),
    full_data JSONB NOT NULL
);

-- Enable RLS for tax_computations
ALTER TABLE public.tax_computations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read tax_computations" ON public.tax_computations FOR SELECT USING (true);
CREATE POLICY "Allow public insert tax_computations" ON public.tax_computations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update tax_computations" ON public.tax_computations FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete tax_computations" ON public.tax_computations FOR DELETE USING (true);


-- 3. Table for Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    target_email VARCHAR(255) DEFAULT 'taxcalac@gmail.com',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read support_tickets" ON public.support_tickets FOR SELECT USING (true);
CREATE POLICY "Allow public insert support_tickets" ON public.support_tickets FOR INSERT WITH CHECK (true);

