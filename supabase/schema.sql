-- ==============================================================================
-- SRI YMB TRADING COMPANY — MIRCHI INVENTORY MANAGEMENT SYSTEM
-- SUPABASE POSTGRESQL DATABASE SCHEMA & ROW LEVEL SECURITY
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE (Authorized Administrators)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. COLD STORAGES TABLE
CREATE TABLE IF NOT EXISTS public.cold_storages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    location TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    capacity_quintals NUMERIC(12, 2) NOT NULL DEFAULT 0,
    remarks TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. INVENTORY LOTS TABLE
CREATE TABLE IF NOT EXISTS public.inventory_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_number TEXT NOT NULL UNIQUE,
    item_name TEXT NOT NULL,
    chilli_variety TEXT NOT NULL,
    cold_storage_id UUID NOT NULL REFERENCES public.cold_storages(id) ON DELETE RESTRICT,
    supplier_name TEXT NOT NULL,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    original_quantity NUMERIC(12, 2) NOT NULL CHECK (original_quantity > 0),
    current_quantity NUMERIC(12, 2) NOT NULL CHECK (current_quantity >= 0),
    unit TEXT NOT NULL CHECK (unit IN ('quintals', 'kilograms')),
    purchase_rate NUMERIC(12, 2) NOT NULL DEFAULT 0,
    rate_unit TEXT NOT NULL DEFAULT 'per_quintal' CHECK (rate_unit IN ('per_quintal', 'per_kg')),
    bill_reference TEXT,
    remarks TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. STOCK MOVEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID NOT NULL REFERENCES public.inventory_lots(id) ON DELETE RESTRICT,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT')),
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL CHECK (unit IN ('quintals', 'kilograms')),
    quantity_kg NUMERIC(14, 2) NOT NULL CHECK (quantity_kg > 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    cold_storage_id UUID REFERENCES public.cold_storages(id) ON DELETE SET NULL,
    destination_or_source TEXT,
    vehicle_number TEXT,
    bill_reference TEXT,
    remarks TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. BILLS TABLE
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_number TEXT NOT NULL,
    bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    supplier TEXT NOT NULL,
    lot_number TEXT,
    cold_storage_id UUID REFERENCES public.cold_storages(id) ON DELETE SET NULL,
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    remarks TEXT,
    uploaded_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    user_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. PAYMENTS TABLE (UPI & Gateway Collections)
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

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_inventory_lot_number ON public.inventory_lots(lot_number);
CREATE INDEX IF NOT EXISTS idx_inventory_variety ON public.inventory_lots(chilli_variety);
CREATE INDEX IF NOT EXISTS idx_inventory_cold_storage ON public.inventory_lots(cold_storage_id);
CREATE INDEX IF NOT EXISTS idx_movements_lot_id ON public.stock_movements(lot_id);
CREATE INDEX IF NOT EXISTS idx_movements_date ON public.stock_movements(date);
CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON public.bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_bills_lot_number ON public.bills(lot_number);
CREATE INDEX IF NOT EXISTS idx_payments_number ON public.payments(payment_number);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_utr ON public.payments(utr_number);


-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cold_storages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;


-- Helper function to check if the current user is an authorized active admin
CREATE OR REPLACE FUNCTION public.is_authorized_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Admins can view profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id OR public.is_authorized_admin());

CREATE POLICY "Admins can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Cold storages policies
CREATE POLICY "Authorized admins can read cold storages"
    ON public.cold_storages FOR SELECT
    TO authenticated
    USING (public.is_authorized_admin());

CREATE POLICY "Authorized admins can insert cold storages"
    ON public.cold_storages FOR INSERT
    TO authenticated
    WITH CHECK (public.is_authorized_admin());

CREATE POLICY "Authorized admins can update cold storages"
    ON public.cold_storages FOR UPDATE
    TO authenticated
    USING (public.is_authorized_admin());

CREATE POLICY "Authorized admins can delete empty cold storages"
    ON public.cold_storages FOR DELETE
    TO authenticated
    USING (
        public.is_authorized_admin()
        AND NOT EXISTS (
            SELECT 1 FROM public.inventory_lots
            WHERE cold_storage_id = cold_storages.id AND current_quantity > 0 AND is_archived = false
        )
    );

-- Inventory lots policies
CREATE POLICY "Authorized admins can read inventory"
    ON public.inventory_lots FOR SELECT
    TO authenticated
    USING (public.is_authorized_admin());

CREATE POLICY "Authorized admins can insert inventory"
    ON public.inventory_lots FOR INSERT
    TO authenticated
    WITH CHECK (public.is_authorized_admin());

CREATE POLICY "Authorized admins can update inventory"
    ON public.inventory_lots FOR UPDATE
    TO authenticated
    USING (public.is_authorized_admin());

CREATE POLICY "Authorized admins can delete inventory"
    ON public.inventory_lots FOR DELETE
    TO authenticated
    USING (public.is_authorized_admin());

-- Stock movements policies
CREATE POLICY "Authorized admins can read movements"
    ON public.stock_movements FOR SELECT
    TO authenticated
    USING (public.is_authorized_admin());

CREATE POLICY "Authorized admins can insert movements"
    ON public.stock_movements FOR INSERT
    TO authenticated
    WITH CHECK (public.is_authorized_admin());

-- Bills policies
CREATE POLICY "Authorized admins can read bills"
    ON public.bills FOR SELECT
    TO authenticated
    USING (public.is_authorized_admin());

CREATE POLICY "Authorized admins can insert bills"
    ON public.bills FOR INSERT
    TO authenticated
    WITH CHECK (public.is_authorized_admin());

CREATE POLICY "Authorized admins can update bills"
    ON public.bills FOR UPDATE
    TO authenticated
    USING (public.is_authorized_admin());

CREATE POLICY "Authorized admins can delete bills"
    ON public.bills FOR DELETE
    TO authenticated
    USING (public.is_authorized_admin());

-- Audit logs policies
CREATE POLICY "Authorized admins can read audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.is_authorized_admin());

CREATE POLICY "Authorized admins can insert audit logs"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (public.is_authorized_admin());

-- ==============================================================================
-- DATABASE TRANSACTION FUNCTION: RECORD STOCK MOVEMENT ATOMICALLY
-- Guarantees inventory consistency, prevents negative stock & converts units safely
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.record_stock_movement(
    p_lot_id UUID,
    p_movement_type TEXT,
    p_quantity NUMERIC,
    p_unit TEXT,
    p_date DATE,
    p_cold_storage_id UUID,
    p_destination_or_source TEXT,
    p_vehicle_number TEXT,
    p_bill_reference TEXT,
    p_remarks TEXT,
    p_created_by TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_lot RECORD;
    v_qty_in_lot_unit NUMERIC;
    v_qty_kg NUMERIC;
    v_new_quantity NUMERIC;
    v_movement_id UUID;
BEGIN
    -- 1. Lock the inventory lot row for update
    SELECT * INTO v_lot
    FROM public.inventory_lots
    WHERE id = p_lot_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Inventory lot not found with ID %', p_lot_id;
    END IF;

    IF v_lot.is_archived THEN
        RAISE EXCEPTION 'Cannot record movement for archived lot %', v_lot.lot_number;
    END IF;

    -- 2. Standardize quantities (1 Quintal = 100 kg)
    IF p_unit = 'quintals' THEN
        v_qty_kg := p_quantity * 100.0;
    ELSIF p_unit = 'kilograms' THEN
        v_qty_kg := p_quantity;
    ELSE
        RAISE EXCEPTION 'Invalid unit: %. Must be "quintals" or "kilograms"', p_unit;
    END IF;

    -- Convert movement quantity to the unit stored on the lot
    IF v_lot.unit = 'quintals' THEN
        v_qty_in_lot_unit := v_qty_kg / 100.0;
    ELSE
        v_qty_in_lot_unit := v_qty_kg;
    END IF;

    -- 3. Validate and calculate new balance
    IF p_movement_type = 'OUT' THEN
        IF v_lot.current_quantity < v_qty_in_lot_unit THEN
            RAISE EXCEPTION 'Insufficient stock. Available: % %, requested removal: % %',
                v_lot.current_quantity, v_lot.unit, v_qty_in_lot_unit, v_lot.unit;
        END IF;
        v_new_quantity := v_lot.current_quantity - v_qty_in_lot_unit;
    ELSIF p_movement_type = 'IN' THEN
        v_new_quantity := v_lot.current_quantity + v_qty_in_lot_unit;
    ELSIF p_movement_type = 'ADJUSTMENT' THEN
        -- Positive adjustment
        v_new_quantity := v_lot.current_quantity + v_qty_in_lot_unit;
    ELSE
        RAISE EXCEPTION 'Invalid movement type: %', p_movement_type;
    END IF;

    -- 4. Update the lot current quantity
    UPDATE public.inventory_lots
    SET current_quantity = v_new_quantity,
        updated_at = now()
    WHERE id = p_lot_id;

    -- 5. Insert movement record
    INSERT INTO public.stock_movements (
        lot_id,
        movement_type,
        quantity,
        unit,
        quantity_kg,
        date,
        cold_storage_id,
        destination_or_source,
        vehicle_number,
        bill_reference,
        remarks,
        created_by
    ) VALUES (
        p_lot_id,
        p_movement_type,
        p_quantity,
        p_unit,
        v_qty_kg,
        p_date,
        COALESCE(p_cold_storage_id, v_lot.cold_storage_id),
        p_destination_or_source,
        p_vehicle_number,
        p_bill_reference,
        p_remarks,
        p_created_by
    ) RETURNING id INTO v_movement_id;

    -- 6. Insert audit log
    INSERT INTO public.audit_logs (
        action_type,
        entity_type,
        entity_id,
        details,
        user_email
    ) VALUES (
        'STOCK_MOVEMENT',
        'inventory_lots',
        p_lot_id::text,
        jsonb_build_object(
            'movement_id', v_movement_id,
            'lot_number', v_lot.lot_number,
            'movement_type', p_movement_type,
            'quantity', p_quantity,
            'unit', p_unit,
            'previous_quantity', v_lot.current_quantity,
            'new_quantity', v_new_quantity,
            'destination_or_source', p_destination_or_source
        ),
        p_created_by
    );

    RETURN jsonb_build_object(
        'success', true,
        'movement_id', v_movement_id,
        'lot_id', p_lot_id,
        'previous_quantity', v_lot.current_quantity,
        'new_quantity', v_new_quantity,
        'unit', v_lot.unit
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- STORAGE BUCKET CONFIGURATION FOR BILLS
-- ==============================================================================

-- Create private storage bucket 'bills' if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('bills', 'bills', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Allow authenticated users with admin profile to read/upload/delete in 'bills' bucket
DROP POLICY IF EXISTS "Admins can upload bill files" ON storage.objects;
CREATE POLICY "Admins can upload bill files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'bills');

DROP POLICY IF EXISTS "Admins can view bill files" ON storage.objects;
CREATE POLICY "Admins can view bill files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'bills');

DROP POLICY IF EXISTS "Admins can delete bill files" ON storage.objects;
CREATE POLICY "Admins can delete bill files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'bills');

-- ==============================================================================
-- PAYMENTS & UPI INTEGRATION (YOUPI-PG, DIRECT UPI QR, RAZORPAY)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number TEXT NOT NULL UNIQUE,
    payment_type TEXT NOT NULL DEFAULT 'SALE_COLLECTION' CHECK (payment_type IN ('SALE_COLLECTION', 'PURCHASE_PAYMENT', 'STORAGE_RENTAL', 'ADVANCE', 'OTHER')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('UPI_SCANNER', 'UPI_QR', 'UPI_APP', 'YOUPI_PG', 'BANK_TRANSFER', 'CASH')),
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

