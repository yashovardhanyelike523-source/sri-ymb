# SRI YMB TRADING COMPANY
## Mirchi Inventory Management System — Client Handover & Operating Manual

---

### 🏛️ 1. Executive Summary & Application Scope
**Sri YMB Trading Company — Mirchi Inventory Management System (IMS)** is an enterprise web application engineered specifically for wholesale red chilli trading operations.

The system administers:
- **Red Chilli Inventory:** Lot number identifiers, commercial cultivars (Teja, Byadgi, Guntur Sannam, 273, Devanur Deluxe, Armoor, Wonder Hot, 334), grade specifications, purchase valuation, and unit tracking.
- **Cold Storage Facilities:** Multi-warehouse preservation management across Guntur, Khammam, Byadgi, Warangal, and regional hubs, tracking quintal capacity and space utilization.
- **Transactional Stock Ledger:** Atomic stock intake (+ IN) and sales/dispatch (- OUT) movements with real-time negative inventory prevention.
- **Purchase Mandi Bills & Weighbridge Slips:** Digital document archival with direct mobile camera capture and secure storage in Supabase.
- **Executive Reporting:** Certified formal printable statements formatted for APMC audits and instant Excel/CSV data exports.

---

### 🔑 2. Administrator Access & Security Policies
- **Web Application URL:** Deployed live on Netlify (e.g. `https://sri-ymb.netlify.app` or custom domain `https://ims.sriymb.com`).
- **Initial Admin Setup:** On the login page, administrators can click the **"Register Admin"** button to establish their credentials (full name, email, and secure password).
- **Security Guard:** Self-registration can be toggled in Supabase Auth settings to lock down registrations once all authorized partners have created their accounts.
- **Changing Passwords:**
  1. Once logged in, click **System Settings** in the left sidebar.
  2. Under **Administrator Password & Security**, enter a new password (min. 6 characters) and click **Change Password**.
  3. If forgotten, use the **Forgot Password?** link on the login page to receive a recovery link by email.

---

### 📋 3. Step-by-Step Initial Setup Sequence (For Live Handover)

When receiving the software with clean zero tables, follow this initial sequence to populate your company data:

#### Step A: Register Your Cold Storage Facilities
1. Click **Cold Storage** in the sidebar (or click the button in the Dashboard Onboarding banner).
2. Click **Add Cold Storage**.
3. Fill in:
   - **Facility Name:** e.g., *Guntur Mega Cold Storage Ltd.*
   - **Address:** Mandi Road / NH-16 Kakani Road.
   - **Incharge Person & Phone:** Warehouse manager contact.
   - **Total Capacity:** In **Quintals** (used for automatic space utilization tracking).
4. Click **Create Cold Storage**. Repeat for all your active cold preservation warehouses.

#### Step B: Add Active Red Chilli Lots
1. Click **Mirchi Inventory** $\rightarrow$ **Add Stock Lot**.
2. Enter the lot details:
   - **Lot Number:** Enter your physical lot tag (e.g. `YMB-2026-TEJA-01`) or click *Auto Generate*.
   - **Chilli Cultivar:** Select *Teja*, *Byadgi*, *Guntur Sannam*, *273*, *Devanur Deluxe*, *Armoor*, *Wonder Hot*, or *334*.
   - **Item Description / Grade:** e.g. *Stemless Grade A Export Quality*.
   - **Cold Storage Location:** Select from the dropdown of your registered storages.
   - **Supplier Name:** Farmer, commission agent, or APMC mandi trader.
   - **Opening Quantity & Unit:** Enter quantity in **Quintals** or **Kilograms**.
   - **Purchase Rate:** Price in `₹ / Quintal` or `₹ / kg`. The system automatically computes your total procurement valuation.
   - **Purchase Date, Bill Reference & Transport Vehicle Number.**
3. Click **Save Mirchi Lot**.

#### Step C: Upload Mandi Purchase Bills & Slips
1. Click **Purchase Bills** $\rightarrow$ **Upload Purchase Bill**.
2. From a computer, drag and drop the PDF or scanned image.
3. From a mobile phone, tap **Camera Photo Capture** to take a live picture of the physical bill.
4. Enter the bill number, date, supplier, and select the linked lot.
5. Click **Upload & Save Bill**.

---

### ⚖️ 4. Standard Units & Mathematical Precision
The application enforces strict conversion standards across all calculations:

$$1\text{ Quintal (Qtl)} = 100\text{ Kilograms (kg)}$$

- Quantities entered in Quintals are automatically shown with their Kilogram equivalent (e.g., `250.00 Qtl (25,000 kg)`).
- When recording a stock dispatch in kilograms from a lot recorded in quintals, the system converts units with exact mathematical precision before deducting.
- Stock valuation automatically factors unit rate differences (`₹/Qtl` vs `₹/kg`).

---

### 🚛 5. Daily Stock Movements (Dispatches & Sales)
Every time chilli is moved out of cold storage for sale, processing, or transfer:
1. Click **Stock Movements** $\rightarrow$ **Record Movement** (or click the quick movement icon next to any lot on the inventory table).
2. Select the lot being dispatched.
3. Choose **STOCK REMOVED (Dispatch / Sale)**.
4. Enter the quantity removed, buyer/destination mandi, lorry vehicle number, and dispatch slip number.
5. **Negative Stock Guard:** If you attempt to dispatch more stock than is physically available in the lot, the system immediately blocks the transaction with an error alert.
6. Click **Confirm Dispatch**. The inventory balance updates atomically across the dashboard and inventory ledger.

---

### 📊 6. Generating Printable Statements & Exports
- **CSV Data Export:** On the Inventory or Stock Movements page, click **Export CSV** to download a formatted spreadsheet compatible with Microsoft Excel or Google Sheets.
- **Formal Printable Inventory Statement:**
  1. Click **Reports & Print** in the sidebar.
  2. Select **Printable Formal Report**.
  3. You will see a document formatted with the official *Sri YMB Trading Company* letterhead, date, active lot schedule, total quintals, total valuation, and authorized signature lines.
  4. Click **Print Report** (or press `Ctrl` + `P`) to print or save as a certified PDF.

---

### 🔄 7. Client Handover: Resetting All Data to Zero
To wipe all test/demo entries and hand over a 100% clean application:
1. Go to **System Settings** in the app.
2. Scroll to **Client Handover • Reset All Data to Zero**.
3. Click **Reset Database to 0**, type `RESET`, and confirm.
4. Alternatively, in the Supabase SQL Editor, run:
   ```sql
   TRUNCATE TABLE public.stock_movements CASCADE;
   TRUNCATE TABLE public.bills CASCADE;
   TRUNCATE TABLE public.inventory_lots CASCADE;
   TRUNCATE TABLE public.cold_storages CASCADE;
   TRUNCATE TABLE public.audit_logs CASCADE;
   ```

---

### 🛠️ 8. Technical Stack & Repository Details
- **Frontend:** React 19, Vite 8, Tailwind CSS v4, Lucide Icons
- **Database & Auth:** Supabase (PostgreSQL with RLS, Triggers, Storage)
- **GitHub Repository:** [https://github.com/yashovardhanyelike523-source/sri-ymb](https://github.com/yashovardhanyelike523-source/sri-ymb)
- **Deployment Platform:** Netlify (Continuous Deployment linked to GitHub `main` branch)
- **Configuration Files:**
  - `netlify.toml` — Build commands, publish folder, and SPA rewrite rules
  - `public/_redirects` — Fallback for direct browser URL navigation
  - `supabase/schema.sql` — PostgreSQL schema, functions, and Row-Level Security
  - `supabase/reset_all_data_to_zero.sql` — Instant cleanup script for fresh client setup
