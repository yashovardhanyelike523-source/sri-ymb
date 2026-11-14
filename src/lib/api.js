// ==============================================================================
// SRI YMB TRADING COMPANY — DATABASE & BACKEND API LAYER
// Handles PostgreSQL queries, transactions, validations, and storage
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabase';
import { toKilograms, toQuintals, convertUnit } from './units';

// ==============================================================================
// AUDIT LOGGING HELPER
// ==============================================================================
export async function logAuditEvent(actionType, entityType, entityId, details, userEmail) {
  try {
    if (!isSupabaseConfigured()) return;
    await supabase.from('audit_logs').insert([
      {
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId ? String(entityId) : null,
        details: typeof details === 'object' ? details : { info: details },
        user_email: userEmail || 'system',
      },
    ]);
  } catch (err) {
    console.warn('Audit log write error:', err);
  }
}

// ==============================================================================
// COLD STORAGES API
// ==============================================================================
export async function fetchColdStorages(includeArchived = false) {
  let query = supabase.from('cold_storages').select('*').order('name', { ascending: true });
  if (!includeArchived) {
    query = query.eq('is_archived', false);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createColdStorage(storageData, userEmail) {
  const { data, error } = await supabase
    .from('cold_storages')
    .insert([
      {
        name: storageData.name.trim(),
        location: storageData.location.trim(),
        contact_person: storageData.contact_person?.trim() || null,
        phone: storageData.phone?.trim() || null,
        capacity_quintals: Number(storageData.capacity_quintals) || 0,
        remarks: storageData.remarks?.trim() || null,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  await logAuditEvent('CREATE_COLD_STORAGE', 'cold_storages', data.id, { name: data.name }, userEmail);
  return data;
}

export async function updateColdStorage(id, storageData, userEmail) {
  const { data, error } = await supabase
    .from('cold_storages')
    .update({
      name: storageData.name.trim(),
      location: storageData.location.trim(),
      contact_person: storageData.contact_person?.trim() || null,
      phone: storageData.phone?.trim() || null,
      capacity_quintals: Number(storageData.capacity_quintals) || 0,
      remarks: storageData.remarks?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  await logAuditEvent('UPDATE_COLD_STORAGE', 'cold_storages', id, storageData, userEmail);
  return data;
}

export async function archiveColdStorage(id, isArchived, userEmail) {
  const { data, error } = await supabase
    .from('cold_storages')
    .update({ is_archived: isArchived, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  await logAuditEvent(
    isArchived ? 'ARCHIVE_COLD_STORAGE' : 'UNARCHIVE_COLD_STORAGE',
    'cold_storages',
    id,
    { isArchived },
    userEmail
  );
  return data;
}

export async function deleteColdStorage(id, userEmail) {
  // Business Rule: Check if storage has any non-archived inventory lots with stock
  const { data: lots, error: checkError } = await supabase
    .from('inventory_lots')
    .select('id, lot_number, current_quantity')
    .eq('cold_storage_id', id)
    .gt('current_quantity', 0)
    .eq('is_archived', false);

  if (checkError) throw checkError;

  if (lots && lots.length > 0) {
    throw new Error(
      `Cannot permanently delete storage facility because it currently holds ${lots.length} active stock lots (${lots.map((l) => l.lot_number).join(', ')}). Please archive the storage or transfer the stock first.`
    );
  }

  const { error } = await supabase.from('cold_storages').delete().eq('id', id);
  if (error) throw error;
  await logAuditEvent('DELETE_COLD_STORAGE', 'cold_storages', id, { id }, userEmail);
  return true;
}

// ==============================================================================
// INVENTORY LOTS API
// ==============================================================================
export async function fetchInventoryLots({ includeArchived = false, variety, storageId, search } = {}) {
  let query = supabase
    .from('inventory_lots')
    .select(`
      *,
      cold_storage:cold_storages (id, name, location)
    `)
    .order('purchase_date', { ascending: false });

  if (!includeArchived) {
    query = query.eq('is_archived', false);
  }

  if (variety && variety !== 'all') {
    query = query.eq('chilli_variety', variety);
  }

  if (storageId && storageId !== 'all') {
    query = query.eq('cold_storage_id', storageId);
  }

  const { data, error } = await query;
  if (error) throw error;

  let results = data || [];

  if (search && search.trim()) {
    const s = search.toLowerCase().trim();
    results = results.filter(
      (item) =>
        item.lot_number?.toLowerCase().includes(s) ||
        item.item_name?.toLowerCase().includes(s) ||
        item.supplier_name?.toLowerCase().includes(s) ||
        item.chilli_variety?.toLowerCase().includes(s) ||
        item.cold_storage?.name?.toLowerCase().includes(s) ||
        item.bill_reference?.toLowerCase().includes(s)
    );
  }

  return results;
}

export async function createInventoryLot(lotData, userEmail) {
  const qty = Number(lotData.original_quantity);
  if (!qty || qty <= 0) {
    throw new Error('Original quantity must be greater than zero.');
  }

  const unit = lotData.unit === 'kilograms' ? 'kilograms' : 'quintals';

  const insertPayload = {
    lot_number: lotData.lot_number.trim().toUpperCase(),
    item_name: lotData.item_name.trim(),
    chilli_variety: lotData.chilli_variety,
    cold_storage_id: lotData.cold_storage_id,
    supplier_name: lotData.supplier_name.trim(),
    purchase_date: lotData.purchase_date || new Date().toISOString().split('T')[0],
    original_quantity: qty,
    current_quantity: qty, // starts equal to original
    unit: unit,
    purchase_rate: Number(lotData.purchase_rate) || 0,
    rate_unit: lotData.rate_unit || 'per_quintal',
    bill_reference: lotData.bill_reference?.trim() || null,
    remarks: lotData.remarks?.trim() || null,
  };

  const { data, error } = await supabase
    .from('inventory_lots')
    .insert([insertPayload])
    .select(`*, cold_storage:cold_storages(id, name)`)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Lot number "${insertPayload.lot_number}" already exists. Please use a unique lot number.`);
    }
    throw error;
  }

  // Also automatically log initial 'IN' stock movement
  const qtyKg = toKilograms(qty, unit);
  await supabase.from('stock_movements').insert([
    {
      lot_id: data.id,
      movement_type: 'IN',
      quantity: qty,
      unit: unit,
      quantity_kg: qtyKg,
      date: insertPayload.purchase_date,
      cold_storage_id: insertPayload.cold_storage_id,
      destination_or_source: `Initial Purchase from ${insertPayload.supplier_name}`,
      vehicle_number: lotData.vehicle_number || null,
      bill_reference: insertPayload.bill_reference,
      remarks: 'Initial stock intake recorded upon lot creation.',
      created_by: userEmail || 'system',
    },
  ]);

  await logAuditEvent('CREATE_INVENTORY_LOT', 'inventory_lots', data.id, insertPayload, userEmail);
  return data;
}

export async function updateInventoryLot(id, lotData, userEmail) {
  const updatePayload = {
    item_name: lotData.item_name?.trim(),
    chilli_variety: lotData.chilli_variety,
    cold_storage_id: lotData.cold_storage_id,
    supplier_name: lotData.supplier_name?.trim(),
    purchase_date: lotData.purchase_date,
    purchase_rate: Number(lotData.purchase_rate) || 0,
    rate_unit: lotData.rate_unit,
    bill_reference: lotData.bill_reference?.trim() || null,
    remarks: lotData.remarks?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  // If user is editing lot_number
  if (lotData.lot_number) {
    updatePayload.lot_number = lotData.lot_number.trim().toUpperCase();
  }

  const { data, error } = await supabase
    .from('inventory_lots')
    .update(updatePayload)
    .eq('id', id)
    .select(`*, cold_storage:cold_storages(id, name)`)
    .single();

  if (error) throw error;
  await logAuditEvent('UPDATE_INVENTORY_LOT', 'inventory_lots', id, updatePayload, userEmail);
  return data;
}

export async function archiveInventoryLot(id, isArchived, userEmail) {
  const { data, error } = await supabase
    .from('inventory_lots')
    .update({ is_archived: isArchived, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  await logAuditEvent(
    isArchived ? 'ARCHIVE_LOT' : 'UNARCHIVE_LOT',
    'inventory_lots',
    id,
    { isArchived },
    userEmail
  );
  return data;
}

export async function deleteInventoryLot(id, userEmail) {
  // Check if there are movements other than initial IN
  const { data: movements } = await supabase
    .from('stock_movements')
    .select('id, movement_type')
    .eq('lot_id', id);

  if (movements && movements.some((m) => m.movement_type === 'OUT')) {
    throw new Error(
      'Cannot delete this lot because it has dispatch/removal movements recorded. Please archive the lot instead to preserve ledger integrity.'
    );
  }

  // Delete movements associated
  await supabase.from('stock_movements').delete().eq('lot_id', id);

  const { error } = await supabase.from('inventory_lots').delete().eq('id', id);
  if (error) throw error;

  await logAuditEvent('DELETE_LOT', 'inventory_lots', id, { id }, userEmail);
  return true;
}

// ==============================================================================
// STOCK MOVEMENTS API (TRANSACTIONAL & SAFE)
// ==============================================================================
export async function fetchStockMovements({ lotId, storageId, startDate, endDate, movementType } = {}) {
  let query = supabase
    .from('stock_movements')
    .select(`
      *,
      lot:inventory_lots (id, lot_number, item_name, chilli_variety, unit),
      cold_storage:cold_storages (id, name, location)
    `)
    .order('created_at', { ascending: false });

  if (lotId) query = query.eq('lot_id', lotId);
  if (storageId) query = query.eq('cold_storage_id', storageId);
  if (movementType && movementType !== 'all') query = query.eq('movement_type', movementType);
  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function recordStockMovement(movementData, userEmail) {
  const {
    lot_id,
    movement_type, // 'IN' or 'OUT'
    quantity,
    unit,
    date,
    cold_storage_id,
    destination_or_source,
    vehicle_number,
    bill_reference,
    remarks,
  } = movementData;

  const numQty = Number(quantity);
  if (!numQty || numQty <= 0) {
    throw new Error('Movement quantity must be a positive number greater than 0.');
  }

  // First try the server-side RPC database transaction function
  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('record_stock_movement', {
      p_lot_id: lot_id,
      p_movement_type: movement_type,
      p_quantity: numQty,
      p_unit: unit,
      p_date: date || new Date().toISOString().split('T')[0],
      p_cold_storage_id: cold_storage_id || null,
      p_destination_or_source: destination_or_source?.trim() || null,
      p_vehicle_number: vehicle_number?.trim() || null,
      p_bill_reference: bill_reference?.trim() || null,
      p_remarks: remarks?.trim() || null,
      p_created_by: userEmail || 'admin',
    });

    if (!rpcError && rpcResult?.success) {
      return rpcResult;
    }
    if (rpcError && !rpcError.message.includes('function') && !rpcError.message.includes('does not exist')) {
      // It's a genuine business exception from the trigger (like Insufficient Stock)
      throw new Error(rpcError.message);
    }
  } catch (err) {
    // If it's a known error from the function (e.g. Insufficient stock), throw it immediately
    if (err.message && (err.message.includes('Insufficient stock') || err.message.includes('archived lot'))) {
      throw err;
    }
    // Otherwise fallback to safe client-verified transaction flow
  }

  // Safe client-side verification and updates
  const { data: lot, error: fetchErr } = await supabase
    .from('inventory_lots')
    .select('*')
    .eq('id', lot_id)
    .single();

  if (fetchErr || !lot) {
    throw new Error('Inventory lot could not be found.');
  }

  if (lot.is_archived) {
    throw new Error(`Cannot record movement for archived lot ${lot.lot_number}`);
  }

  // Convert movement quantity to lot unit
  const movementQtyInLotUnit = convertUnit(numQty, unit, lot.unit);
  const qtyKg = toKilograms(numQty, unit);

  let newCurrentQuantity = Number(lot.current_quantity);

  if (movement_type === 'OUT') {
    if (lot.current_quantity < movementQtyInLotUnit) {
      throw new Error(
        `Insufficient stock! Lot ${lot.lot_number} currently has only ${lot.current_quantity} ${lot.unit} available. You requested removal of ${movementQtyInLotUnit} ${lot.unit}.`
      );
    }
    newCurrentQuantity = Number((newCurrentQuantity - movementQtyInLotUnit).toFixed(2));
  } else if (movement_type === 'IN') {
    newCurrentQuantity = Number((newCurrentQuantity + movementQtyInLotUnit).toFixed(2));
  } else {
    throw new Error(`Invalid movement type: ${movement_type}`);
  }

  // 1. Update lot current_quantity
  const { error: updateErr } = await supabase
    .from('inventory_lots')
    .update({
      current_quantity: newCurrentQuantity,
      updated_at: new Date().toISOString(),
    })
    .eq('id', lot_id);

  if (updateErr) throw updateErr;

  // 2. Insert movement ledger record
  const { data: movementRec, error: moveErr } = await supabase
    .from('stock_movements')
    .insert([
      {
        lot_id,
        movement_type,
        quantity: numQty,
        unit,
        quantity_kg: qtyKg,
        date: date || new Date().toISOString().split('T')[0],
        cold_storage_id: cold_storage_id || lot.cold_storage_id,
        destination_or_source: destination_or_source?.trim() || null,
        vehicle_number: vehicle_number?.trim() || null,
        bill_reference: bill_reference?.trim() || null,
        remarks: remarks?.trim() || null,
        created_by: userEmail || 'admin',
      },
    ])
    .select()
    .single();

  if (moveErr) throw moveErr;

  await logAuditEvent(
    'STOCK_MOVEMENT',
    'stock_movements',
    movementRec.id,
    {
      lot_number: lot.lot_number,
      movement_type,
      quantity: numQty,
      unit,
      previous_quantity: lot.current_quantity,
      new_quantity: newCurrentQuantity,
    },
    userEmail
  );

  return {
    success: true,
    movement_id: movementRec.id,
    lot_id,
    previous_quantity: lot.current_quantity,
    new_quantity: newCurrentQuantity,
    unit: lot.unit,
  };
}

// ==============================================================================
// BILLS API (STORAGE & METADATA)
// ==============================================================================
export async function fetchBills({ search, supplier, lotNumber } = {}) {
  let query = supabase
    .from('bills')
    .select(`
      *,
      cold_storage:cold_storages (id, name)
    `)
    .order('bill_date', { ascending: false });

  if (supplier) query = query.ilike('supplier', `%${supplier}%`);
  if (lotNumber) query = query.ilike('lot_number', `%${lotNumber}%`);

  const { data, error } = await query;
  if (error) throw error;

  let results = data || [];
  if (search && search.trim()) {
    const s = search.toLowerCase().trim();
    results = results.filter(
      (b) =>
        b.bill_number?.toLowerCase().includes(s) ||
        b.supplier?.toLowerCase().includes(s) ||
        b.lot_number?.toLowerCase().includes(s) ||
        b.file_name?.toLowerCase().includes(s)
    );
  }

  return results;
}

export async function uploadBillFile(file) {
  // Validate file type
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file format. Only PDF, JPG, JPEG, and PNG files are accepted.');
  }

  // Validate file size (Max 15MB)
  const maxSize = 15 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File size exceeds the 15MB limit. Please upload a compressed document.');
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const filePath = `bills/${timestamp}_${cleanName}`;

  const { data, error } = await supabase.storage.from('bills').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    // If bucket does not exist yet, surface clear guidance
    if (error.message?.includes('bucket not found') || error.message?.includes('Bucket not found')) {
      throw new Error(
        'Storage bucket "bills" is not configured yet in Supabase. Please execute the bucket initialization in supabase/schema.sql.'
      );
    }
    throw error;
  }

  return {
    storagePath: data.path,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  };
}

export async function createBillRecord(billData, userEmail) {
  // Check if bill number already exists
  const { data: existing } = await supabase
    .from('bills')
    .select('id')
    .eq('bill_number', billData.bill_number.trim())
    .limit(1);

  if (existing && existing.length > 0) {
    throw new Error(`Bill Number "${billData.bill_number}" already exists in the system. Duplicate submissions are not allowed.`);
  }

  const insertPayload = {
    bill_number: billData.bill_number.trim(),
    bill_date: billData.bill_date || new Date().toISOString().split('T')[0],
    supplier: billData.supplier.trim(),
    lot_number: billData.lot_number?.trim() || null,
    cold_storage_id: billData.cold_storage_id || null,
    storage_path: billData.storage_path,
    file_name: billData.file_name,
    file_size: billData.file_size,
    file_type: billData.file_type,
    remarks: billData.remarks?.trim() || null,
    uploaded_by: userEmail || 'admin',
  };

  const { data, error } = await supabase
    .from('bills')
    .insert([insertPayload])
    .select()
    .single();

  if (error) throw error;
  await logAuditEvent('UPLOAD_BILL', 'bills', data.id, insertPayload, userEmail);
  return data;
}

export async function getBillUrl(storagePath) {
  if (!storagePath) return null;
  // Get signed URL for private bucket (valid 1 hour)
  const { data, error } = await supabase.storage.from('bills').createSignedUrl(storagePath, 3600);
  if (error || !data?.signedUrl) {
    // Try public fallback if bucket was made public
    const { data: pubData } = supabase.storage.from('bills').getPublicUrl(storagePath);
    return pubData?.publicUrl || null;
  }
  return data.signedUrl;
}

export async function deleteBill(id, storagePath, userEmail) {
  // Delete file from storage
  if (storagePath) {
    try {
      await supabase.storage.from('bills').remove([storagePath]);
    } catch (e) {
      console.warn('Storage delete warning:', e);
    }
  }

  const { error } = await supabase.from('bills').delete().eq('id', id);
  if (error) throw error;

  await logAuditEvent('DELETE_BILL', 'bills', id, { storagePath }, userEmail);
  return true;
}

// ==============================================================================
// AUDIT LOGS FETCH
// ==============================================================================
export async function fetchAuditLogs(limit = 100) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ==============================================================================
// RESET & ZERO DATABASE FOR CLIENT HANDOVER
// ==============================================================================
export async function clearAllInventoryData(userEmail) {
  // Delete in reverse order of foreign key dependencies
  const { error: moveErr } = await supabase
    .from('stock_movements')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (moveErr) console.warn('Movement wipe note:', moveErr.message);

  const { error: billErr } = await supabase
    .from('bills')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (billErr) console.warn('Bill wipe note:', billErr.message);

  const { error: lotErr } = await supabase
    .from('inventory_lots')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (lotErr) console.warn('Lot wipe note:', lotErr.message);

  const { error: storErr } = await supabase
    .from('cold_storages')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (storErr) console.warn('Storage wipe note:', storErr.message);

  await logAuditEvent('RESET_CLIENT_HANDOVER', 'system', 'all', { action: 'wiped_all_data_to_zero' }, userEmail);
  return true;
}

// ==============================================================================
// DASHBOARD METRICS CALCULATION
// ==============================================================================
export async function fetchDashboardMetrics() {
  // 1. Fetch all active inventory lots
  const { data: lots, error: lotsErr } = await supabase
    .from('inventory_lots')
    .select('id, current_quantity, unit, chilli_variety, purchase_rate, rate_unit')
    .eq('is_archived', false);

  if (lotsErr) throw lotsErr;

  // 2. Fetch cold storages count
  const { count: storageCount, error: storageErr } = await supabase
    .from('cold_storages')
    .select('id', { count: 'exact', head: true })
    .eq('is_archived', false);

  if (storageErr) throw storageErr;

  // 3. Fetch bills count
  const { count: billsCount, error: billsErr } = await supabase
    .from('bills')
    .select('id', { count: 'exact', head: true });

  if (billsErr) throw billsErr;

  // 4. Fetch recent movements
  const { data: recentMovements, error: moveErr } = await supabase
    .from('stock_movements')
    .select(`
      *,
      lot:inventory_lots(id, lot_number, chilli_variety, item_name),
      cold_storage:cold_storages(id, name)
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  if (moveErr) throw moveErr;

  // 5. Fetch recent bills
  const { data: recentBills, error: billRecErr } = await supabase
    .from('bills')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (billRecErr) throw billRecErr;

  // Aggregate metrics
  let totalStockKg = 0;
  let totalStockQuintals = 0;
  let totalInventoryValue = 0;
  const varietyMap = {};

  (lots || []).forEach((lot) => {
    const qty = Number(lot.current_quantity) || 0;
    const kg = toKilograms(qty, lot.unit);
    const qtl = toQuintals(qty, lot.unit);

    totalStockKg += kg;
    totalStockQuintals += qtl;

    const rate = Number(lot.purchase_rate) || 0;
    if (lot.rate_unit === 'per_quintal') {
      totalInventoryValue += qtl * rate;
    } else {
      totalInventoryValue += kg * rate;
    }

    const varName = lot.chilli_variety || 'Other';
    if (!varietyMap[varName]) {
      varietyMap[varName] = { variety: varName, quintals: 0, kg: 0, count: 0 };
    }
    varietyMap[varName].quintals += qtl;
    varietyMap[varName].kg += kg;
    varietyMap[varName].count += 1;
  });

  return {
    totalStockQuintals: Number(totalStockQuintals.toFixed(2)),
    totalStockKg: Number(totalStockKg.toFixed(2)),
    totalActiveLots: (lots || []).length,
    totalColdStorages: storageCount || 0,
    totalBills: billsCount || 0,
    totalInventoryValue: Number(totalInventoryValue.toFixed(2)),
    varietyBreakdown: Object.values(varietyMap),
    recentMovements: recentMovements || [],
    recentBills: recentBills || [],
  };
}

