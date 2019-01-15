(() => {
  "use strict";

  // test support IndexDB
  if (!("indexedDB" in window)) {
    console.warn("IndexedDB not supported");
    return;
  }

  // open or create db
  const name = "test";
  const version = 6;
  const dbPromise = idb
    .openDb(name, version, upgradeDb => {
      // launch when changed version DB
      console.info("Initialize or Migrate DB");

      switch (upgradeDb.oldVersion) {
        case 0: // no db created before
          // a store introduced in version 1
          upgradeDb.createObjectStore("store1");
        case 1:
          // a new store in version 2
          upgradeDb.createObjectStore("store2", { keyPath: "name" });
        case 2:
          // create store with auto increment
          upgradeDb.createObjectStore("store5", {
            keyPath: "id",
            autoIncrement: true
          });
        case 3:
          // create index
          const store4 = upgradeDb.createObjectStore("store4");
          store4.createIndex("name", "name", { unique: false });

          // getting access to the db
          const store1 = upgradeDb.transaction.objectStore("store1");
          store1.createIndex("email", "email", { unique: true });
          store1.createIndex("age", "age", { unique: false });
        case 4:
          // check exists store
          if (!upgradeDb.objectStoreNames.contains("store3")) {
            upgradeDb.createObjectStore("store3");
          }
        case 5:
          // delete store
          upgradeDb.deleteObjectStore("store3");
      }
    })
    .then(db => {
      console.log("Success. Initialized or updated DB");

      return db;
    })
    // put store items
    .then(db => {
      const tx = db.transaction("store1", "readwrite");
      const store = tx.objectStore("store1");
      store.put(
        {
          ssn: "444-44-4444",
          name: "Bill",
          age: 35,
          email: "bill@company.com"
        },
        "test1"
      );
      store.put("Bye Bye! 1", 232);
      store.put("Bye Bye! 2", "test2");
      store.put(
        {
          ssn: "555-55-5511",
          name: "Donna2",
          age: 34,
          email: "donna1@home.org"
        },
        "test3"
      );
      store.put(
        {
          ssn: "555-55-5555",
          name: "Donna",
          age: 32,
          email: "donna@home.org"
        },
        "test4"
      );
      store.put("Bye Bye! 5", 5);
      store.put("Bye Bye! 6", 6);

      return db;
    })
    // remove store item
    .then(db => {
      const tx = db.transaction("store1", "readwrite");
      const store = tx.objectStore("store1");
      store.delete(232);

      return db;
    })
    .then(db => {
      console.log("Success. Item deleted");

      return db;
    })
    // create transaction
    .then(db => {
      const val = "hey!";
      const key = 1;
      const tx = db.transaction("store1", "readwrite");
      tx.objectStore("store1").put(val, key);

      return db;
    })
    .then(db => {
      console.log("Success. Transaction complete");

      return db;
    })
    .catch(db => {
      console.log("Error. Transaction failed");

      return db;
    })
    // get store item
    .then(db => {
      // get
      const tx = db.transaction("store1").objectStore("store1");

      tx.get(6).then(obj => {
        console.log(obj);
      });

      // get all
      return tx.getAll();
    })
    .then(obj => console.log(obj));

  // create and delete db
  idb
    .openDb("mydb", 1, upgradeDb => {
      upgradeDb.createObjectStore("store1");
    })
    .then(db => console.log("Success. Created DB: mydb"));

  idb.deleteDb("mydb").then(() => console.log("Success. Deleted DB: mydb"));

  // test work with cursor
  const searchItems = (lower, upper) => {
    if (lower === "" && upper === "") {
      return;
    }

    let range;
    if (lower !== "" && upper !== "") {
      range = IDBKeyRange.bound(lower, upper);
    } else if (lower === "") {
      range = IDBKeyRange.upperBound(upper);
    } else {
      range = IDBKeyRange.lowerBound(lower);
    }

    idb
      .openDb("test", version, upgradeDb => {})
      .then(db => {
        const tx = db.transaction("store1", "readonly");
        const store = tx.objectStore("store1");
        const index = store.index("age");

        return index.openCursor(range);
      })
      .then(function showRange(cursor) {
        if (!cursor) {
          return;
        }

        console.log("cursor is at:", cursor.key);

        for (const field in cursor.value) {
          console.log(cursor.value[field]);
        }

        return cursor.continue().then(showRange);
      })
      .then(() => {
        console.log("done!");
      });
  };

  searchItems(32, 34);
})();
