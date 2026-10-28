-- ==============================================================================
-- SRI YMB TRADING COMPANY — PAYMENTS & UPI INTEGRATION MIGRATION
-- Run this in your Supabase SQL Editor to add UPI and Gateway payments support
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number TEXT NOT NULL UNIQUE,
    payment_type TEXT NOT NULL DEFAULT 'SALE_COLLECTION' CHECK (payment_type IN ('SALE_COLLECTION', 'PURCHASE_PAYMENT', 'STORAGE_RENTAL', 'ADVANCE', 'OTHER')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('UPI_QR', 'UPI_APP', 'RAZORPAY', 'BANK_TRANSFER', 'CASH')),
    upi_id TEXT,
    utr_number TEXT,
    gateway_payment_id TEXT,
    gateway_order_id TEXT,
    status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'PENDING', 'FAILED')),
    lot_id UUID REFERENCES public.inventory_lots(id) ON DELETE SET NULL,
    bill_reference TEXT,
    party_name TEXT NOT NULL,
    party_phone TEXT,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    remarks TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_number ON public.payments(payment_number);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_utr ON public.payments(utr_number);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated payments" ON public.payments;
CREATE POLICY "Allow authenticated payments" ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
