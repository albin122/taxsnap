-- Supabase SQL Schema Migration File for TaxEase Pro Tax Computations
-- Create Table for Tax Computations

CREATE TABLE IF NOT EXISTS public.tax_computations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pan VARCHAR(10) NOT NULL,
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(255),
    office_name VARCHAR(255),
    place VARCHAR(255),
    gross_income NUMERIC(12, 2) NOT NULL,
    taxable_income NUMERIC(12, 2) NOT NULL,
    total_tax_liability NUMERIC(12, 2) NOT NULL,
    net_payable_or_refund NUMERIC(12, 2) NOT NULL,
    full_data JSONB NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.tax_computations ENABLE ROW LEVEL SECURITY;

-- Allow Public Read Access
CREATE POLICY "Allow public read tax computations"
    ON public.tax_computations
    FOR SELECT
    USING (true);

-- Allow Public Insert Access
CREATE POLICY "Allow public insert tax computations"
    ON public.tax_computations
    FOR INSERT
    WITH CHECK (true);

-- Allow Public Delete Access
CREATE POLICY "Allow public delete tax computations"
    ON public.tax_computations
    FOR DELETE
    USING (true);
