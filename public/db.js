let db;
let budgetVersion;

//Referenced w18 mini project

// Creates new db
const request = indexedDB.open('BudgetDB', budgetVersion || 21);

request.onupgradeneeded = function (e) {
  console.log('Upgrade needed in IndexDB');
  const { oldVersion } = e;
  const newVersion = e.newVersion || db.version;
  console.log(`DB Updated from version ${oldVersion} to ${newVersion}`);
  db = e.target.result;

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore('BudgetStore', { autoIncrement: true });
  }
};

request.onerror = function (e) {
  console.log(`Error! ${e.target.errorCode}`);
};

function checkDatabase() {
  // Open a transaction on your BudgetStore db
  let transaction = db.transaction(['BudgetStore'], 'readwrite');

  // access your BudgetStore object
  const store = transaction.objectStore('BudgetStore');

  // Get all records from store and set to a variable
  const getAll = store.getAll();

  // If the request was successful
  getAll.onsuccess = function () {
    // If there are items in the store, we need to bulk add them when we are back online
    if (getAll.result.length > 0) {
      fetch('/api/transaction', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((res) => {
        
          if (res.length !== 0) {
            // Opens transaction
            transaction = db.transaction(['BudgetStore'], 'readwrite');

            // Assign the current store to a variable
            const currentStore = transaction.objectStore('BudgetStore');
            currentStore.clear();
           

          }
        });
    }
  };
}

request.onsuccess = function (e) {
  console.log('success');
  db = e.target.result;
  if (navigator.onLine) {
    checkDatabase();
  }
};

const saveRecord = (record) => {
  
  // Create a transaction on the BudgetStore db with readwrite access
  const transaction = db.transaction(['BudgetStore'], 'readwrite');

  // Access your BudgetStore object store
  const store = transaction.objectStore('BudgetStore');

  // Add record to your store with add method.
  store.add(record);
};

// Listen for app coming back online
window.addEventListener('online', checkDatabase);
