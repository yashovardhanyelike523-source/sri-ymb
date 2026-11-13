// ==============================================================================
// SRI YMB TRADING COMPANY — MAIN APPLICATION ENTRY & LAYOUT
// Mirchi Inventory Management System
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { fetchColdStorages, fetchInventoryLots } from './lib/api';

// Common Components
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import MovementsPage from './pages/MovementsPage';
import ColdStoragePage from './pages/ColdStoragePage';
import BillsPage from './pages/BillsPage';
import ReportsPage from './pages/ReportsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SettingsPage from './pages/SettingsPage';

// Modals
import AddStockModal from './components/inventory/AddStockModal';
import EditStockModal from './components/inventory/EditStockModal';
import StockDetailsModal from './components/inventory/StockDetailsModal';
import RecordMovementModal from './components/movements/RecordMovementModal';
import AddEditStorageModal from './components/storages/AddEditStorageModal';
import UploadBillModal from './components/bills/UploadBillModal';
import BillViewerModal from './components/bills/BillViewerModal';


export default function App() {
  const { user, loading, isConfigured } = useAuth();

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Cached shared data for modals
  const [coldStorages, setColdStorages] = useState([]);
  const [inventoryLots, setInventoryLots] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal Open States
  const [addStockOpen, setAddStockOpen] = useState(false);
  const [editStockModal, setEditStockModal] = useState({ isOpen: false, lot: null });
  const [detailsModal, setDetailsModal] = useState({ isOpen: false, lot: null });
  const [movementModal, setMovementModal] = useState({ isOpen: false, initialLot: null });
  const [storageModal, setStorageModal] = useState({ isOpen: false, storage: null });
  const [uploadBillOpen, setUploadBillOpen] = useState(false);
  const [viewBillModal, setViewBillModal] = useState({ isOpen: false, bill: null });


  // Load shared records when logged in
  useEffect(() => {
    if (user && isConfigured) {
      Promise.all([
        fetchColdStorages(false).catch(() => []),
        fetchInventoryLots({ includeArchived: false }).catch(() => []),
      ]).then(([storages, lots]) => {
        setColdStorages(storages || []);
        setInventoryLots(lots || []);
      });
    }
  }, [user, isConfigured, refreshKey]);

  const triggerRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-white font-extrabold text-base tracking-tight uppercase">
          Sri YMB Trading Company
        </h2>
        <p className="text-amber-400/80 text-xs mt-1">Initializing Secure Mirchi IMS...</p>
      </div>
    );
  }

  // Unauthenticated: Display Login Page
  if (!user) {
    return (
      <LoginPage
        onOpenSettings={() => {
          // If unconfigured, allow opening settings
          setCurrentTab('settings');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased selection:bg-red-700 selection:text-white">
      {/* Top Navbar */}
      <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      {/* Main App Body with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Content View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardPage
                key={`dash-${refreshKey}`}
                onNavigate={(tab) => setCurrentTab(tab)}
                onOpenAddStock={() => setAddStockOpen(true)}
                onOpenRecordMovement={(lot) => setMovementModal({ isOpen: true, initialLot: lot || null })}
                onOpenUploadBill={() => setUploadBillOpen(true)}
                onOpenAddStorage={() => setStorageModal({ isOpen: true, storage: null })}
              />
            )}


            {currentTab === 'inventory' && (
              <InventoryPage
                key={`inv-${refreshKey}`}
                onOpenAddStock={() => setAddStockOpen(true)}
                onOpenEditStock={(lot) => setEditStockModal({ isOpen: true, lot })}
                onOpenStockDetails={(lot) => setDetailsModal({ isOpen: true, lot })}
                onOpenRecordMovement={(lot) => setMovementModal({ isOpen: true, initialLot: lot })}
              />
            )}

            {currentTab === 'movements' && (
              <MovementsPage
                key={`move-${refreshKey}`}
                onOpenRecordMovement={(lot) => setMovementModal({ isOpen: true, initialLot: lot || null })}
              />
            )}

            {currentTab === 'storages' && (
              <ColdStoragePage
                key={`storage-${refreshKey}`}
                onOpenAddStorage={() => setStorageModal({ isOpen: true, storage: null })}
                onOpenEditStorage={(storage) => setStorageModal({ isOpen: true, storage })}
                onOpenStockDetails={(lot) => setDetailsModal({ isOpen: true, lot })}
                onOpenAddStock={() => setAddStockOpen(true)}
              />
            )}

            {currentTab === 'bills' && (
              <BillsPage
                key={`bills-${refreshKey}`}
                onOpenUploadBill={() => setUploadBillOpen(true)}
                onViewBill={(bill) => setViewBillModal({ isOpen: true, bill })}
              />
            )}

            {currentTab === 'reports' && (
              <ReportsPage key={`reports-${refreshKey}`} />
            )}

            {currentTab === 'audit' && (
              <AuditLogsPage key={`audit-${refreshKey}`} />
            )}

            {currentTab === 'settings' && (
              <SettingsPage key={`settings-${refreshKey}`} />
            )}
          </div>
        </main>
      </div>

      {/* GLOBAL MODALS */}
      {/* 1. Add Stock Modal */}
      <AddStockModal
        isOpen={addStockOpen}
        onClose={() => setAddStockOpen(false)}
        coldStorages={coldStorages}
        onSuccess={triggerRefresh}
      />

      {/* 2. Edit Stock Modal */}
      <EditStockModal
        isOpen={editStockModal.isOpen}
        onClose={() => setEditStockModal({ isOpen: false, lot: null })}
        lot={editStockModal.lot}
        coldStorages={coldStorages}
        onSuccess={triggerRefresh}
      />

      {/* 3. Stock Details Modal */}
      <StockDetailsModal
        isOpen={detailsModal.isOpen}
        onClose={() => setDetailsModal({ isOpen: false, lot: null })}
        lot={detailsModal.lot}
        onOpenRecordMovement={(lot) => setMovementModal({ isOpen: true, initialLot: lot })}
      />


      {/* 4. Record Movement Modal */}
      <RecordMovementModal
        isOpen={movementModal.isOpen}
        onClose={() => setMovementModal({ isOpen: false, initialLot: null })}
        inventoryLots={inventoryLots}
        initialLot={movementModal.initialLot}
        coldStorages={coldStorages}
        onSuccess={triggerRefresh}
      />

      {/* 5. Add/Edit Cold Storage Modal */}
      <AddEditStorageModal
        isOpen={storageModal.isOpen}
        onClose={() => setStorageModal({ isOpen: false, storage: null })}
        storage={storageModal.storage}
        onSuccess={triggerRefresh}
      />

      {/* 6. Upload Bill Modal */}
      <UploadBillModal
        isOpen={uploadBillOpen}
        onClose={() => setUploadBillOpen(false)}
        inventoryLots={inventoryLots}
        coldStorages={coldStorages}
        onSuccess={triggerRefresh}
      />

      {/* 7. Bill Viewer Modal */}
      <BillViewerModal
        isOpen={viewBillModal.isOpen}
        onClose={() => setViewBillModal({ isOpen: false, bill: null })}
        bill={viewBillModal.bill}
      />
    </div>
  );
}

