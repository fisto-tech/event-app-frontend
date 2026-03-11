import { openDB } from 'idb';

const DB_NAME = 'expo_crm_offline';
const DB_VERSION = 1;
const CUSTOMERS_STORE = 'pending_customers';
const MASTER_STORE = 'master_data';

let dbInstance = null;

const getDB = async () => {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(CUSTOMERS_STORE)) {
        const store = db.createObjectStore(CUSTOMERS_STORE, { keyPath: 'local_id' });
        store.createIndex('sync_status', 'sync_status');
      }
      if (!db.objectStoreNames.contains(MASTER_STORE)) {
        db.createObjectStore(MASTER_STORE, { keyPath: 'key' });
      }
    },
  });
  return dbInstance;
};

// Customer offline operations
export const saveOfflineCustomer = async (customerData) => {
  const db = await getDB();
  const record = {
    ...customerData,
    local_id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    sync_status: 'pending_sync',
  };
  await db.put(CUSTOMERS_STORE, record);
  return record;
};

export const getPendingCustomers = async () => {
  const db = await getDB();
  return db.getAllFromIndex(CUSTOMERS_STORE, 'sync_status', 'pending_sync');
};

export const markCustomerSynced = async (local_id) => {
  const db = await getDB();
  const record = await db.get(CUSTOMERS_STORE, local_id);
  if (record) {
    record.sync_status = 'synced';
    await db.put(CUSTOMERS_STORE, record);
  }
};

export const getAllOfflineCustomers = async () => {
  const db = await getDB();
  return db.getAll(CUSTOMERS_STORE);
};

export const getPendingCount = async () => {
  const pending = await getPendingCustomers();
  return pending.length;
};

// Master data caching
export const cacheMasterData = async (key, data) => {
  const db = await getDB();
  await db.put(MASTER_STORE, { key, data, cached_at: new Date().toISOString() });
};

export const getCachedMasterData = async (key) => {
  const db = await getDB();
  const record = await db.get(MASTER_STORE, key);
  return record?.data || null;
};

// Sync logic
export const syncPendingRecords = async (syncFn) => {
  const pending = await getPendingCustomers();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  try {
    const result = await syncFn(pending);
    for (const item of result.synced || []) {
      await markCustomerSynced(item.local_id);
      synced++;
    }
  } catch (err) {
    failed = pending.length;
    console.error('Sync failed:', err);
  }

  return { synced, failed };
};
