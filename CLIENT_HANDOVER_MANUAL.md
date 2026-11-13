# SRI YMB TRADING COMPANY
## Mirchi Inventory Management System — Client Handover & Operating Manual

---

### 🏛️ 1. Executive Summary & Application Scope
**Sri YMB Trading Company — Mirchi Inventory Management System (IMS)** is an internal administration software developed exclusively for Sri YMB Trading Company.

The application manages:
- **Red Chilli Inventory:** Variety specifications, grade description, purchase date, unit rate, and lot identifiers.
- **Cold Storage Preservation:** Warehouse facility locations (Guntur, Khammam, Byadgi, Warangal, etc.), capacity in quintals, manager contacts, and chamber stock placement.
- **Stock Movements Ledger:** Atomic stock intake (+ IN) and dispatch/sales (- OUT), with negative inventory prevention.
- **Purchase Bills & Invoices:** Digital filing of APMC Mandi bills, weighbridge slips, and tax invoices stored in private Supabase Storage with mobile camera snapping.
- **Certified Reporting:** Instant printable inventory statements, variety breakdowns, and full CSV exports.

---

### 🔑 2. Administrator Access & Security Policies
- **URL Access:** `http://localhost:5174` (or your deployed domain e.g., `https://ims.sriymb.com`).
- **Internal Security Rule:** Public self-registration is closed. Only authorized administrators with credentials created in Supabase Auth can enter the system.
- **Changing Passwords:**
  1. Once logged in, click **System Settings** in the left sidebar.
  2. Under **Administrator Password & Security**, enter a new password and click **Change Password**.
  3. If forgotten, use the **Forgot Password?** link on the login page to receive a recovery link by email.

---

### 📋 3. Step-by-Step Initial Setup Guide (For The Business Owner)

When logging in for the first time with clean database tables, follow this initial sequence:

#### Step A: Register Your Cold Storage Facilities
1. Click **Cold Storage** in the sidebar (or click the button in the Dashboard Onboarding banner).
2. Click **Add Cold Storage**.
3. Fill in:
   - **Facility Name:** e.g., *Guntur Mega Cold Storage Ltd.*
   - **Address:** Full location / mandi road.
   - **Incharge Person & Phone:** Warehouse manager details.
   - **Total Capacity:** In **Quintals** (used for automatic space utilization calculations).
4. Click **Create Cold Storage**. Repeat for all your active facilities.

#### Step B: Add Your Active Red Chilli Lots
1. Click **Mirchi Inventory** $\rightarrow$ **Add Stock Lot**.
2. Enter the lot details:
   - **Lot Number:** Enter your physical lot tag (e.g. `YMB-2026-TEJA-01`) or click *Auto Generate*.
   - **Chilli Cultivar:** Select *Teja*, *Byadgi*, *Guntur Sannam*, *273*, *Devanur Deluxe*, *Armoor*, *Wonder Hot*, or *334*.
   - **Item Description / Grade:** e.g. *Stemless Grade A Export Quality*.
   - **Cold Storage Location:** Select from the dropdown of your registered storages.
   - **Supplier Name:** Farmer, commission agent, or APMC mandi seller.
   - **Opening Quantity & Unit:** Enter quantity in **Quintals** or **Kilograms**.
   - **Purchase Rate:** Price in `₹ / Quintal` or `₹ / kg`. The system automatically computes your total procurement valuation.
   - **Purchase Date, Bill Reference & Transport Vehicle Number.**
3. Click **Save Mirchi Lot**.

#### Step C: Upload Mandi Purchase Bills
1. Click **Purchase Bills** $\rightarrow$ **Upload Purchase Bill**.
2. From a computer, drag and drop the PDF/JPG bill.
3. From a mobile phone, tap **Camera Photo Capture** to take a live picture of the physical bill.
4. Enter the bill number, date, supplier, and select the linked lot.
5. Click **Upload & Save Bill**.

---

### ⚖️ 4. Standard Units & Mathematical Precision
The application enforces strict unit conversions:

$$1\text{ Quintal (Qtl)} = 100\text{ Kilograms (kg)}$$

- Quantities entered in Quintals are automatically shown with their Kilogram equivalent (e.g., `250.00 Qtl (25,000 kg)`).
- When recording a stock dispatch in kilograms from a lot recorded in quintals, the system converts units with exact mathematical precision before deducting.

---

### 🚛 5. Daily Stock Movements (Dispatches & Sales)
Every time chilli is moved out of cold storage for sale or processing:
1. Click **Stock Movements** $\rightarrow$ **Record Movement** (or click the quick movement icon next to any lot on the inventory table).
2. Select the lot being dispatched.
3. Choose **STOCK REMOVED (Dispatch / Sale)**.
4. Enter the quantity removed, buyer/destination mandi, lorry vehicle number, and dispatch slip number.
5. **Negative Stock Guard:** If you attempt to dispatch more stock than is physically available in the lot, the system immediately blocks the transaction with an error alert.
6. Click **Confirm Dispatch**. The inventory balance updates atomically across the dashboard and inventory ledger.

---

### 📊 6. Generating Printable Statements & Exports
- **CSV Data Export:** On the Inventory or Stock Movements page, click **Export CSV** to download a formatted spreadsheet compatible with Excel or Google Sheets.
- **Printable Inventory Statement:**
  1. Click **Reports & Print** in the sidebar.
  2. Select **Printable Formal Report**.
  3. You will see a document formatted with the official *Sri YMB Trading Company* header, date, active lot schedule, total quintals, total valuation, and authorized signature lines.
  4. Click **Print Report** (or press `Ctrl` + `P`) to print or save as a certified PDF.

---

### 🛡️ 7. Technical Architecture & Database Backup
- **PostgreSQL Database:** Hosted securely on Supabase with encrypted tables.
- **Backups:** Supabase automatically performs continuous daily point-in-time backups.
- **Row Level Security:** Only authenticated administrators with active admin status can view or modify records.


