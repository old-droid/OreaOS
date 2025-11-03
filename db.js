// db.js - IndexedDB utility functions

const DB_NAME = 'OreaOS_DB';
const DB_VERSION = 1;
const STORES = {
    users: 'users',
    notepad: 'notepad_notes',
    pythonEditor: 'python_scripts',
    browser: 'browser_data' // For cookies or history if implemented
};

let db;

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            for (const storeName in STORES) {
                if (!db.objectStoreNames.contains(STORES[storeName])) {
                    db.createObjectStore(STORES[storeName], { keyPath: 'id', autoIncrement: true });
                }
            }
            console.log('IndexedDB upgrade complete.');
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('IndexedDB opened successfully.');
            resolve(db);
        };

        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.errorCode);
            reject(event.target.error);
        };
    });
}

function getObjectStore(storeName, mode) {
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
}

async function addData(storeName, data) {
    await openDatabase(); // Ensure DB is open
    return new Promise((resolve, reject) => {
        const store = getObjectStore(storeName, 'readwrite');
        const request = store.add(data);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getData(storeName, id) {
    await openDatabase(); // Ensure DB is open
    return new Promise((resolve, reject) => {
        const store = getObjectStore(storeName, 'readonly');
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getAllData(storeName) {
    await openDatabase(); // Ensure DB is open
    return new Promise((resolve, reject) => {
        const store = getObjectStore(storeName, 'readonly');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function updateData(storeName, data) {
    await openDatabase(); // Ensure DB is open
    return new Promise((resolve, reject) => {
        const store = getObjectStore(storeName, 'readwrite');
        const request = store.put(data);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function deleteData(storeName, id) {
    await openDatabase(); // Ensure DB is open
    return new Promise((resolve, reject) => {
        const store = getObjectStore(storeName, 'readwrite');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Export functions for use in other scripts
window.db = {
    openDatabase,
    addData,
    getData,
    getAllData,
    updateData,
    deleteData,
    STORES
};
