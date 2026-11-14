-- ==============================================================================
-- SRI YMB TRADING COMPANY — CLEAR ALL DATA FOR CLIENT HANDOVER
-- Clears all demo / sample data across all tables and resets all counts to zero.
-- Preserves user accounts and database structure so the client can enter their own data.
-- ==============================================================================

-- 1. Remove all records cleanly respecting foreign keys
TRUNCATE TABLE public.stock_movements CASCADE;
TRUNCATE TABLE public.bills CASCADE;
TRUNCATE TABLE public.inventory_lots CASCADE;
TRUNCATE TABLE public.cold_storages CASCADE;
TRUNCATE TABLE public.audit_logs CASCADE;

-- 2. Verify all tables are at zero
SELECT 
    (SELECT COUNT(*) FROM public.inventory_lots) AS remaining_lots,
    (SELECT COUNT(*) FROM public.cold_storages) AS remaining_storages,
    (SELECT COUNT(*) FROM public.stock_movements) AS remaining_movements,
    (SELECT COUNT(*) FROM public.bills) AS remaining_bills,
    (SELECT COUNT(*) FROM public.audit_logs) AS remaining_audit_logs;
