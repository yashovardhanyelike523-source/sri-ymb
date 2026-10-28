-- ==============================================================================
-- SRI YMB TRADING COMPANY — INITIAL SEED DATA
-- Run after schema.sql and creating your initial Supabase Admin user.
-- ==============================================================================

-- 1. Insert Initial Cold Storage Facilities
INSERT INTO public.cold_storages (id, name, location, contact_person, phone, capacity_quintals, remarks)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Guntur Mega Cold Storage Ltd.', 'NH-16, Kakani Road, Guntur, AP - 522005', 'M. Venkateswarlu', '+91 98480 12345', 25000.00, 'Main hub for Guntur Sannam & Teja lots. Chamber 2 & 4 reserved.'),
    ('22222222-2222-2222-2222-222222222222', 'Khammam Agro Preservation Hub', 'Industrial Area, Khammam, Telangana - 507003', 'K. Srinivasa Rao', '+91 94401 67890', 18000.00, 'Specialized humidity control for high pungency Teja chilli.'),
    ('33333333-3333-3333-3333-333333333333', 'Byadgi Heritage Cold Warehouse', 'APMC Yard, Byadgi, Haveri Dist, Karnataka - 581106', 'Basavaraj Patil', '+91 98860 45678', 15000.00, 'Dedicated facility for Byadgi KDL & Dabbi deep red wrinkles.'),
    ('44444444-4444-4444-4444-444444444444', 'Warangal Red Spice Cold Storage', 'Enumamula APMC Market, Warangal, TS - 506006', 'Ramesh Reddy', '+91 97012 34567', 12000.00, 'Chamber 1 for Armoor and Wonder Hot varieties.')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Initial Inventory Lots
INSERT INTO public.inventory_lots (
    id, lot_number, item_name, chilli_variety, cold_storage_id, 
    supplier_name, purchase_date, original_quantity, current_quantity, 
    unit, purchase_rate, rate_unit, bill_reference, remarks
) VALUES 
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'YMB-2026-TEJA-01',
        'Teja Stemless Grade A Export Quality',
        'Teja',
        '22222222-2222-2222-2222-222222222222',
        'Khammam Farmers Agro Producer Ltd',
        '2026-09-15',
        350.00,
        280.00,
        'quintals',
        21500.00,
        'per_quintal',
        'KFAP-2026-904',
        'Super bright red color, 75,000 to 80,000 SHU pungency. Cleaned and moisture below 10%.'
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'YMB-2026-BYAD-02',
        'Byadgi KDL Wrinkled Premium Red',
        'Byadgi',
        '33333333-3333-3333-3333-333333333333',
        'Malnad Spice Traders & Commission Agents',
        '2026-09-28',
        220.00,
        185.00,
        'quintals',
        34000.00,
        'per_quintal',
        'MST-BY-4512',
        'Highest oil content and natural deep red color value (150-160 ASTA). Nil stem.'
    ),
    (
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'YMB-2026-SAN-03',
        'Guntur Sannam S4 Deluxe',
        'Guntur Sannam',
        '11111111-1111-1111-1111-111111111111',
        'Sri Lakshmi Chennakesava Trading Co.',
        '2026-10-05',
        400.00,
        400.00,
        'quintals',
        18200.00,
        'per_quintal',
        'SLC-GT-8821',
        'Standard medium pungency with robust red luster. Standard Gunny bags.'
    ),
    (
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'YMB-2026-D273-04',
        'Chilli Variety 273 Extra Long',
        '273',
        '11111111-1111-1111-1111-111111111111',
        'Bhavani Agricultural Produce, Darsi',
        '2026-10-12',
        150.00,
        120.00,
        'quintals',
        19800.00,
        'per_quintal',
        'BAP-DAR-109',
        'Extra long pods, vibrant red, high demand in Northern markets.'
    ),
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'YMB-2026-DD-05',
        'Devanur Deluxe Shiny Red',
        'Devanur Deluxe',
        '44444444-4444-4444-4444-444444444444',
        'Telangana Mirchi Growers Union',
        '2026-10-18',
        100.00,
        100.00,
        'quintals',
        22800.00,
        'per_quintal',
        'TMGU-WGL-334',
        'Thick skin, shiny coat, excellent storage life.'
    )
ON CONFLICT (lot_number) DO NOTHING;

-- 3. Insert Initial Stock Movements
INSERT INTO public.stock_movements (
    lot_id, movement_type, quantity, unit, quantity_kg, date,
    cold_storage_id, destination_or_source, vehicle_number, bill_reference, remarks, created_by
) VALUES
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'IN',
        350.00,
        'quintals',
        35000.00,
        '2026-09-15',
        '22222222-2222-2222-2222-222222222222',
        'Received from Khammam Mandi Supplier',
        'TS 04 UA 8892',
        'KFAP-2026-904',
        'Initial lot intake. Inspected and deposited in Chamber 2.',
        'admin@sriymb.com'
    ),
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'OUT',
        70.00,
        'quintals',
        7000.00,
        '2026-10-02',
        '22222222-2222-2222-2222-222222222222',
        'Dispatched to Everest Spice Mills, Mumbai',
        'MH 04 FK 4410',
        'DISP-YMB-081',
        'First release from Lot 01 for contract delivery.',
        'admin@sriymb.com'
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'IN',
        220.00,
        'quintals',
        22000.00,
        '2026-09-28',
        '33333333-3333-3333-3333-333333333333',
        'Direct procurement from Haveri auction',
        'KA 27 B 9011',
        'MST-BY-4512',
        'High quality grade Byadgi KDL pods. Stored at 4°C.',
        'admin@sriymb.com'
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'OUT',
        35.00,
        'quintals',
        3500.00,
        '2026-10-15',
        '33333333-3333-3333-3333-333333333333',
        'Sold to Kerala Oleoresin Extraction Co.',
        'KL 07 CD 2291',
        'DISP-YMB-093',
        'Sample tested for 155 ASTA color value passed.',
        'admin@sriymb.com'
    ),
    (
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'IN',
        150.00,
        'quintals',
        15000.00,
        '2026-10-12',
        '11111111-1111-1111-1111-111111111111',
        'Bhavani Agricultural Produce Delivery',
        'AP 26 TE 5500',
        'BAP-DAR-109',
        'Received in Guntur Chamber 3.',
        'admin@sriymb.com'
    ),
    (
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'OUT',
        30.00,
        'quintals',
        3000.00,
        '2026-10-22',
        '11111111-1111-1111-1111-111111111111',
        'Delhi Khari Baoli Spice Merchants',
        'DL 1M 7788',
        'DISP-YMB-104',
        'Wholesale parcel sent via dedicated container.',
        'admin@sriymb.com'
    );

-- 4. Insert Initial Bills Records
INSERT INTO public.bills (
    bill_number, bill_date, supplier, lot_number, cold_storage_id,
    storage_path, file_name, file_size, file_type, remarks, uploaded_by
) VALUES 
    (
        'KFAP-2026-904',
        '2026-09-15',
        'Khammam Farmers Agro Producer Ltd',
        'YMB-2026-TEJA-01',
        '22222222-2222-2222-2222-222222222222',
        'bills/sample_teja_bill.pdf',
        'Teja_Procurement_Bill_904.pdf',
        245800,
        'application/pdf',
        'Purchase tax invoice with e-way bill attached.',
        'admin@sriymb.com'
    ),
    (
        'MST-BY-4512',
        '2026-09-28',
        'Malnad Spice Traders & Commission Agents',
        'YMB-2026-BYAD-02',
        '33333333-3333-3333-3333-333333333333',
        'bills/sample_byadgi_bill.jpg',
        'Byadgi_Auction_Invoice_4512.jpg',
        189400,
        'image/jpeg',
        'APMC Mandi auction slip stamped and signed.',
        'admin@sriymb.com'
    ),
    (
        'SLC-GT-8821',
        '2026-10-05',
        'Sri Lakshmi Chennakesava Trading Co.',
        'YMB-2026-SAN-03',
        '11111111-1111-1111-1111-111111111111',
        'bills/sample_guntur_sannam_bill.pdf',
        'Guntur_Sannam_Bill_8821.pdf',
        312000,
        'application/pdf',
        'Weight bridge slips and moisture report included.',
        'admin@sriymb.com'
    );
