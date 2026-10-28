# Sri YMB Trading Company — Mirchi Inventory Management System

An internal enterprise web application built for **Sri YMB Trading Company**, a red chilli trading enterprise. The system administers mirchi lots, cold storage preservation facilities, transactional stock movements (intake & dispatch), and original purchase bills.

---

## 🌶️ Key Features

### 1. Admin Authentication & Security
- **Restricted Access:** Closed internal system (public self-registration disabled).
- **Supabase Auth:** Email & password authentication with show/hide password toggle.
- **Role Verification:** Verified against `profiles` table to ensure only authorized administrators can access.
- **Row Level Security (RLS):** Every PostgreSQL table (`inventory_lots`, `cold_storages`, `stock_movements`, `bills`, `audit_logs`) is protected by strict RLS policies.
- **Password Recovery:** In-app reset flow sending secure single-use recovery links.

### 2. Operational Dashboard
- **Realtime Metrics:** Total available mirchi stock in Quintals and Kilograms, active lot count, registered cold storages, and uploaded bills count.
- **Variety Distribution:** Commercial cultivar breakdown across Teja, Byadgi, Guntur Sannam, 273, Devanur Deluxe, Armoor, Wonder Hot, and 334/S10.
- **Quick Action Triggers:** One-click modals to add stock, record movement, upload bill, or add cold storage.
- **Activity Streams:** Live feeds of recent stock movements and bill uploads.

### 3. Mirchi Inventory Management
- **Full CRUD:** Register lots, view specifications, edit parameters, archive, and delete with safety checks.
- **Mathematical Precision:** Strict unit conversion handling where **1 Quintal (Qtl) = 100 Kilograms (Kg)**.
- **Dynamic Valuation:** Real-time procurement value calculation supporting both `₹ / Quintal` and `₹ / kg` rate structures.
- **Search & Filters:** Real-time search across lot numbers, suppliers, varieties, and cold storage facilities.
- **Data Export:** Full CSV inventory spreadsheet export.

### 4. Safe Stock Movements Ledger
- **Dual Direction:** Supports **Stock Received (+ IN)** and **Stock Removed (- OUT)**.
- **Negative Inventory Prevention:** Atomic database trigger function (`record_stock_movement`) with `FOR UPDATE` row locking ensures dispatches cannot exceed available stock.
- **Comprehensive Audit:** Logs dates, quantity in dual units, buyer/destination, lorry vehicle number, bill reference, and administrator email.
- **Balance Visibility:** Realtime display of opening stock, deduction/addition, and resulting stock balance.

### 5. Cold Storage Management
- **Chamber Tracking:** Facility name, full address, incharge contact name, and phone with direct calling action.
- **Capacity Utilization:** Dynamic calculation of stored stock versus total capacity in quintals with color-coded utilization meters.
- **Lot Distribution:** View all mirchi lots placed in each warehouse.
- **Deletion Safeguard:** Permanent deletion is strictly blocked if a facility holds active stock.

### 6. Purchase Bill Management & Archive
- **Multi-Device Upload:** Supports desktop file selection and direct **mobile camera capture** for physical APMC auction slips.
- **Document Previews:** Instant image thumbnails and PDF format badge before uploading.
- **Private Storage:** Files stored securely in private Supabase Storage bucket (`bills`) with 1-hour signed URL generation for authorized viewing and downloads.
- **Metadata Association:** Links each bill to supplier, lot number, date, and storage location in PostgreSQL.
- **Duplicate Prevention:** Validates bill numbers against database collisions.

### 7. Reports & Printable Stock Statement
- **Chilli Variety Summary:** Aggregates lots, total quintals, kg, and value with percentage share.
- **Storage Summary:** Reports on capacity, stock stored, space available, and utilization rate.
- **Formal Printable Document:** Clean printable inventory statement complete with company letterhead, date, schedule of lots, and signature lines, styled for `window.print()`.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, Vite 8
- **Styling:** Tailwind CSS v4 (Chilli Red `#c1121f`, Maroon `#450a0a`, Golden `#d4af37`, Clean White)
- **Icons:** Lucide React
- **Backend / Database:** Supabase (PostgreSQL with RLS & Stored Procedures)
- **File Storage:** Supabase Storage (Private `bills` bucket)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- A Supabase Project (cloud or self-hosted)

### 2. Installation
```bash
# Clone or navigate to the repository
cd "Sri YMB"

# Install dependencies
npm install
```

### 3. Configure Supabase Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-public-key
```

*(Note: You can also configure credentials directly inside the web app from the **Settings** tab at runtime)*.

### 4. Database Setup (Supabase SQL Editor)
1. Open your Supabase Dashboard -> **SQL Editor**.
2. Open and run [`supabase/schema.sql`](file:///c:/Users/yasho/ymb/Sri%20YMB/supabase/schema.sql). This creates:
   - Tables: `profiles`, `cold_storages`, `inventory_lots`, `stock_movements`, `bills`, `audit_logs`
   - Row Level Security (RLS) policies
   - Atomic database function `record_stock_movement`
   - Storage bucket `bills`
3. Open and run [`supabase/seed.sql`](file:///c:/Users/yasho/ymb/Sri%20YMB/supabase/seed.sql) to populate initial cold storages (Guntur, Khammam, Byadgi, Warangal) and sample mirchi lots.
4. In Supabase Dashboard -> **Authentication** -> **Users**, click **Add user** to create your primary administrator account (e.g. `admin@sriymb.com`).

### 5. Running the Application
```bash
# Start Vite development server
npm run dev

# Or build for production
npm run build
npm run preview
```

---

## 📐 Mathematical Precision Reference

$$\text{Weight in Kilograms (kg)} = \text{Weight in Quintals (Qtl)} \times 100$$
$$\text{Weight in Quintals (Qtl)} = \frac{\text{Weight in Kilograms (kg)}}{100}$$

| Commodity Cultivar | Standard ASTA Color | Pungency (SHU) | Common Mandis |
| :--- | :--- | :--- | :--- |
| **Teja (S17)** | 50 – 70 | 60,000 – 85,000 | Khammam, Guntur, Warangal |
| **Byadgi (KDL/Dabbi)** | 140 – 170 | 10,000 – 25,000 | Byadgi, Haveri, Hubballi |
| **Guntur Sannam (S4/334)**| 70 – 90 | 35,000 – 50,000 | Guntur, Prakasam |
| **273 Extra Long** | 80 – 100 | 30,000 – 45,000 | Darsi, Guntur, Raichur |
| **Devanur Deluxe** | 90 – 120 | 25,000 – 40,000 | Warangal, Khammam |

---

## 🔒 Security Compliance
- No service-role secret keys are ever included in client-side code.
- Only authenticated users with active admin status can view or modify records.
- All files in the `bills` storage bucket require signed URLs with expiration.
- Complete audit logging in `audit_logs` for traceability.
