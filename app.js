// ============================================================
// さふがる工房 イベント管理
// app.js
// ============================================================


// ============================================================
// IndexedDB
// ============================================================

const DB_NAME = "safugaruManager";

let db = null;


// ============================================================
// IndexedDB ストア作成
// ============================================================

function setupDatabaseStores(database) {

    // --------------------------------------------------------
    // 商品
    // --------------------------------------------------------

    if (
        !database.objectStoreNames.contains("products")
    ) {

        const productStore =
            database.createObjectStore(
                "products",
                { keyPath: "id" }
            );

        productStore.createIndex(
            "name",
            "name",
            { unique: false }
        );

    }


    // --------------------------------------------------------
    // 予約
    // --------------------------------------------------------

    if (
        !database.objectStoreNames.contains("reservations")
    ) {

        const reservationStore =
            database.createObjectStore(
                "reservations",
                { keyPath: "id" }
            );

        reservationStore.createIndex(
            "createdAt",
            "createdAt",
            { unique: false }
        );

    }


    // --------------------------------------------------------
    // 売上
    // --------------------------------------------------------

    if (
        !database.objectStoreNames.contains("sales")
    ) {

        const salesStore =
            database.createObjectStore(
                "sales",
                { keyPath: "id" }
            );

        salesStore.createIndex(
            "createdAt",
            "createdAt",
            { unique: false }
        );

    }


    // --------------------------------------------------------
    // 在庫履歴
    // --------------------------------------------------------

    if (
        !database.objectStoreNames.contains(
            "inventoryHistory"
        )
    ) {

        const historyStore =
            database.createObjectStore(
                "inventoryHistory",
                { keyPath: "id" }
            );

        historyStore.createIndex(
            "productId",
            "productId",
            { unique: false }
        );

        historyStore.createIndex(
            "createdAt",
            "createdAt",
            { unique: false }
        );

    }


    // --------------------------------------------------------
    // イベント
    // --------------------------------------------------------

    if (
        !database.objectStoreNames.contains("events")
    ) {

        const eventStore =
            database.createObjectStore(
                "events",
                { keyPath: "id" }
            );

        eventStore.createIndex(
            "date",
            "date",
            { unique: false }
        );

        eventStore.createIndex(
            "createdAt",
            "createdAt",
            { unique: false }
        );

    }


    // --------------------------------------------------------
    // イベント開始在庫
    // --------------------------------------------------------

    if (
        !database.objectStoreNames.contains(
            "eventInventory"
        )
    ) {

        const eventInventoryStore =
            database.createObjectStore(
                "eventInventory",
                { keyPath: "id" }
            );

        eventInventoryStore.createIndex(
            "eventId",
            "eventId",
            { unique: false }
        );

        eventInventoryStore.createIndex(
            "productId",
            "productId",
            { unique: false }
        );

        eventInventoryStore.createIndex(
            "createdAt",
            "createdAt",
            { unique: false }
        );

    }
    // --------------------------------------------------------
// イベント経費
// --------------------------------------------------------

if (
    !database.objectStoreNames.contains(
        "eventExpenses"
    )
) {

    const eventExpensesStore =
        database.createObjectStore(
            "eventExpenses",
            { keyPath: "id" }
        );


    eventExpensesStore.createIndex(
        "eventId",
        "eventId",
        { unique: false }
    );


    eventExpensesStore.createIndex(
        "createdAt",
        "createdAt",
        { unique: false }
    );

}

}
// ============================================================
// 商品カテゴリ
// ============================================================

const categoryData = {

    "キーホルダー": [
        "Vキーホルダー",
        "ケモぶらりん",
        "その他キーホルダー"
    ],

    "缶バッジ": [
        "V缶バッジ",
        "その他缶バッジ"
    ],

    "フィギュア": [
        "Vフィギュア",
        "その他フィギュア"
    ],

    "その他": [
        "その他"
    ]

};


// ============================================================
// アプリの状態
// ============================================================

let currentProductId = null;

let selectedParentCategory = null;
let selectedSubCategory = null;

let reservationCart = [];
let registerCart = [];
let inventoryAdjustProductId = null;
let selectedRegisterEventId = "";

let registerProductSearchText = "";
let registerProductCategory = "";
let registerProductSubCategory = "";
// ============================================================
// IndexedDBを開く
// ============================================================

function openDatabase() {

    return new Promise((resolve, reject) => {

        // ----------------------------------------------------
        // 現在のDBを開く
        // ----------------------------------------------------

        const request =
            indexedDB.open(DB_NAME);


        // ----------------------------------------------------
        // 新規DB作成
        // またはDBバージョンアップ
        // ----------------------------------------------------

        request.onupgradeneeded = event => {

            const database =
                event.target.result;

            setupDatabaseStores(
                database
            );

        };


        // ----------------------------------------------------
        // DBを開けた
        // ----------------------------------------------------

        request.onsuccess = event => {

            db =
                event.target.result;


            // ------------------------------------------------
            // 必要なストア
            // ------------------------------------------------

            const requiredStores = [

                "products",
                "reservations",
                "sales",
                "inventoryHistory",
                "events",
                "eventInventory",
                "eventExpenses"

            ];


            // ------------------------------------------------
            // 足りないストアがあるか確認
            // ------------------------------------------------

            const missingStore =
                requiredStores.some(
                    storeName =>
                        !db.objectStoreNames.contains(
                            storeName
                        )
                );


            // ------------------------------------------------
            // 全部そろっている
            // ------------------------------------------------

            if (!missingStore) {

                // 他のタブなどから
                // バージョンアップ要求が来たら
                // 現在の接続を閉じる

                db.onversionchange = () => {

                    db.close();

                };


                resolve(db);

                return;

            }


            // ------------------------------------------------
            // 足りないストアがある
            // → DBバージョンを1つ上げる
            // ------------------------------------------------

            const currentVersion =
                db.version;


            db.close();


            const upgradeRequest =
                indexedDB.open(
                    DB_NAME,
                    currentVersion + 1
                );


            // ------------------------------------------------
            // バージョンアップ処理
            // ------------------------------------------------

            upgradeRequest.onupgradeneeded =
                event => {

                    const database =
                        event.target.result;

                    setupDatabaseStores(
                        database
                    );

                };


            // ------------------------------------------------
            // バージョンアップ成功
            // ------------------------------------------------

            upgradeRequest.onsuccess =
                event => {

                    db =
                        event.target.result;


                    db.onversionchange = () => {

                        db.close();

                    };


                    resolve(db);

                };


            // ------------------------------------------------
            // バージョンアップ失敗
            // ------------------------------------------------

            upgradeRequest.onerror =
                () => {

                    reject(
                        upgradeRequest.error
                    );

                };


            // ------------------------------------------------
            // 別タブなどがDBを開いていて
            // バージョンアップできない
            // ------------------------------------------------

            upgradeRequest.onblocked =
                () => {

                    console.warn(
                        "IndexedDBのバージョンアップがブロックされています。"
                    );

                };

        };


        // ----------------------------------------------------
        // DBオープン失敗
        // ----------------------------------------------------

        request.onerror = () => {

            reject(
                request.error
            );

        };


        // ----------------------------------------------------
        // DBオープンがブロックされた
        // ----------------------------------------------------

        request.onblocked = () => {

            console.warn(
                "IndexedDBの読み込みがブロックされています。"
            );

        };

    });

}

// ============================================================
// データバックアップ
// ============================================================

async function backupDatabase() {

    const storeNames = [
        "products",
        "reservations",
        "sales",
        "inventoryHistory",
        "events",
        "eventInventory",
        "eventExpenses"
    ];


    const backupData = {
        appName: "さふがる工房 イベント管理",
        backupVersion: 1,
        createdAt: new Date().toISOString(),
        stores: {}
    };


    return new Promise((resolve, reject) => {

        try {

            const transaction =
                db.transaction(
                    storeNames,
                    "readonly"
                );


            storeNames.forEach(
                storeName => {

                    const store =
                        transaction.objectStore(
                            storeName
                        );


                    const request =
                        store.getAll();


                    request.onsuccess =
                        () => {

                            backupData.stores[
                                storeName
                            ] =
                                request.result;

                        };


                    request.onerror =
                        () => {

                            reject(
                                request.error
                            );

                        };

                }
            );


            transaction.oncomplete =
                () => {

                    resolve(
                        backupData
                    );

                };


            transaction.onerror =
                () => {

                    reject(
                        transaction.error
                    );

                };

        } catch (error) {

            reject(error);

        }

    });

}



// ============================================================
// バックアップファイルを書き出す
// ============================================================

async function exportBackup() {

    try {

        if (!db) {

            await openDatabase();

        }


        const backupData =
            await backupDatabase();


        const json =
            JSON.stringify(
                backupData
            );


        const blob =
            new Blob(
                [json],
                {
                    type:
                        "application/json"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const date =
            new Date();


        const dateText =
            [
                date.getFullYear(),
                String(
                    date.getMonth() + 1
                ).padStart(2, "0"),
                String(
                    date.getDate()
                ).padStart(2, "0"),
                "_",
                String(
                    date.getHours()
                ).padStart(2, "0"),
                String(
                    date.getMinutes()
                ).padStart(2, "0")
            ].join("");


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            `さふがる工房_バックアップ_${dateText}.json`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


        alert(
            "バックアップを作成しました。"
        );


    } catch (error) {

        console.error(
            "バックアップ作成エラー",
            error
        );


        alert(
            "バックアップの作成に失敗しました。"
        );

    }

}

// ============================================================
// バックアップからデータを復元
// ============================================================

async function restoreBackup(
    backupData
) {

    const storeNames = [
        "products",
        "reservations",
        "sales",
        "inventoryHistory",
        "events",
        "eventInventory",
        "eventExpenses"
    ];


    // ========================================================
    // バックアップデータの確認
    // ========================================================

    if (
        !backupData ||
        !backupData.stores
    ) {

        throw new Error(
            "バックアップデータの形式が正しくありません。"
        );

    }


    for (
        const storeName
        of storeNames
    ) {

        if (
            !Array.isArray(
                backupData.stores[
                    storeName
                ]
            )
        ) {

            throw new Error(
                `データがありません: ${storeName}`
            );

        }

    }


    // ========================================================
    // 現在のデータを置き換える
    // ========================================================

    return new Promise(
        (resolve, reject) => {

            try {

                const transaction =
                    db.transaction(
                        storeNames,
                        "readwrite"
                    );


                storeNames.forEach(
                    storeName => {

                        const store =
                            transaction.objectStore(
                                storeName
                            );


                        // 現在のデータを削除
                        store.clear();


                        // バックアップデータを追加
                        const records =
                            backupData.stores[
                                storeName
                            ];


                        records.forEach(
                            record => {

                                store.put(
                                    record
                                );

                            }
                        );

                    }
                );


                transaction.oncomplete =
                    () => {

                        resolve();

                    };


                transaction.onerror =
                    () => {

                        reject(
                            transaction.error
                        );

                    };


                transaction.onabort =
                    () => {

                        reject(
                            transaction.error ||
                            new Error(
                                "復元処理が中断されました。"
                            )
                        );

                    };

            } catch (error) {

                reject(error);

            }

        }
    );

}



// ============================================================
// バックアップファイルを読み込む
// ============================================================

async function importBackupFile(
    file
) {

    try {

        if (!file) {

            return;

        }


        const confirmed =
            confirm(
                "バックアップを復元すると、現在のデータはバックアップの内容に置き換わります。\n\n現在のデータを残したい場合は、先に「データをバックアップ」してください。\n\n復元しますか？"
            );


        if (!confirmed) {

            return;

        }


        const text =
            await file.text();


        const backupData =
            JSON.parse(
                text
            );


        if (!db) {

            await openDatabase();

        }


        await restoreBackup(
            backupData
        );


        // ====================================================
        // 画面を更新
        // ====================================================

        await loadProducts();
        await loadReservations();
        await loadInventory();
        await loadInventoryHistory();
        await loadHistory();
        await loadEvents();


        alert(
            "バックアップを復元しました。\n\n画面を確認してください。"
        );


    } catch (error) {

        console.error(
            "バックアップ復元エラー",
            error
        );


        alert(
            "バックアップの復元に失敗しました。\n\nバックアップファイルが正しいものか確認してください。"
        );

    }

}



// ============================================================
// ストレージを永続化
// ============================================================

async function requestPersistentStorage() {

    try {

        if (
            !navigator.storage ||
            !navigator.storage.persist
        ) {

            console.log(
                "永続ストレージAPIには対応していません。"
            );

            return false;

        }


        const alreadyPersistent =
            navigator.storage.persisted
                ? await navigator.storage.persisted()
                : false;


        if (
            alreadyPersistent
        ) {

            console.log(
                "永続ストレージはすでに有効です。"
            );

            return true;

        }


        const persistent =
            await navigator.storage.persist();


        console.log(
            persistent
                ? "永続ストレージが有効になりました。"
                : "永続ストレージは許可されませんでした。"
        );


        return persistent;

    } catch (error) {

        console.warn(
            "永続ストレージ設定エラー",
            error
        );


        return false;

    }

}
// ============================================================
// ID
// ============================================================

function createId() {

    if (
        typeof crypto !== "undefined" &&
        crypto.randomUUID
    ) {

        return crypto.randomUUID();

    }


    return (
        Date.now().toString(36) +
        Math.random().toString(36).substring(2)
    );

}


// ============================================================
// HTMLエスケープ
// ============================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ============================================================
// 金額表示
// ============================================================

function formatYen(value) {

    return (
        "¥" +
        Number(value || 0).toLocaleString()
    );

}


// ============================================================
// 日時表示
// ============================================================

function formatDateTime(value) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    return date.toLocaleString(
        "ja-JP",
        {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// ============================================================
// 商品全件取得
// ============================================================

function getAllProducts() {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                "products",
                "readonly"
            );


        const store =
            transaction.objectStore(
                "products"
            );


        const request =
            store.getAll();


        request.onsuccess = () => {

            resolve(
                request.result || []
            );

        };


        request.onerror = () => {

            reject(
                request.error
            );

        };

    });

}


// ============================================================
// 商品1件取得
// ============================================================

function getProduct(id) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                "products",
                "readonly"
            );


        const store =
            transaction.objectStore(
                "products"
            );


        const request =
            store.get(id);


        request.onsuccess = () => {

            resolve(
                request.result
            );

        };


        request.onerror = () => {

            reject(
                request.error
            );

        };

    });

}


// ============================================================
// 販売可能数
// 実在庫 - 予約確保
// ============================================================

function getSellableStock(product) {

    return Math.max(
        0,
        Number(product.stock || 0) -
        Number(product.reserved || 0)
    );

}


// ============================================================
// 商品一覧
// ============================================================

async function loadProducts() {

    const products =
        await getAllProducts();


    renderCategoryNavigation();

    renderProducts(products);

}


// ============================================================
// 商品一覧表示
// ============================================================

function renderProducts(products) {

    const container =
        document.getElementById(
            "product-list"
        );


    if (!container) {
        return;
    }


    let filteredProducts =
        products;


    if (selectedParentCategory) {

        filteredProducts =
            filteredProducts.filter(
                product => {

                    const parent =
                        product.parentCategory ||
                        product.category ||
                        "";


                    return (
                        parent ===
                        selectedParentCategory
                    );

                }
            );

    }


    if (selectedSubCategory) {

        filteredProducts =
            filteredProducts.filter(
                product => {

                    return (
                        product.subCategory ===
                        selectedSubCategory
                    );

                }
            );

    }


    container.innerHTML = "";


    if (
        filteredProducts.length === 0
    ) {

        container.innerHTML = `
            <div style="
                grid-column:1/-1;
                padding:40px;
                text-align:center;
                color:#999;
            ">
                商品がありません
            </div>
        `;


        return;

    }


    filteredProducts.forEach(
        product => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "product-card";


            const parent =
                product.parentCategory ||
                product.category ||
                "";


            const sub =
                product.subCategory ||
                "";


            const categoryText =
                sub
                    ? `${parent} ＞ ${sub}`
                    : parent;


            const sellable =
                getSellableStock(product);


            card.innerHTML = `

                <div class="product-image">

                    ${
                        product.image

                        ? `
                            <img
                                src="${product.image}"
                                alt="${escapeHTML(
                                    product.name
                                )}"
                            >
                        `

                        : `
                            <span>📦</span>
                        `
                    }

                </div>


                <div class="product-info">

                    <div class="product-category">
                        ${escapeHTML(
                            categoryText
                        )}
                    </div>


                    <div class="product-name">
                        ${escapeHTML(
                            product.name
                        )}
                    </div>


                    <div class="product-price">
                        ${formatYen(
                            product.price
                        )}
                    </div>


                    <div class="product-stock">

                        在庫
                        ${Number(
                            product.stock || 0
                        )}個

                        /

                        予約
                        ${Number(
                            product.reserved || 0
                        )}個

                        /

                        販売可能
                        ${sellable}個

                    </div>

                </div>

            `;


            card.addEventListener(
                "click",
                () => {

                    openProductModal(
                        product.id
                    );

                }
            );


            container.appendChild(
                card
            );

        }
    );

}



// ============================================================
// カテゴリナビ
// ============================================================

function renderCategoryNavigation() {

    const container =
        document.getElementById(
            "category-navigation"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    const allButton =
        document.createElement(
            "button"
        );


    allButton.className =
        "category-all-button";


    if (
        !selectedParentCategory &&
        !selectedSubCategory
    ) {

        allButton.classList.add(
            "active"
        );

    }


    allButton.textContent =
        "すべての商品";


    allButton.addEventListener(
        "click",
        () => {

            selectedParentCategory =
                null;


            selectedSubCategory =
                null;


            updateCategoryBreadcrumb();

            loadProducts();

        }
    );


    container.appendChild(
        allButton
    );


    Object.entries(categoryData)

    
        .forEach(
            ([parent, children]) => {

                const parentBox =
                    document.createElement(
                        "div"
                    );


                parentBox.className =
                    "category-parent";


                if (
                    selectedParentCategory ===
                    parent
                ) {

                    parentBox.classList.add(
                        "open"
                    );

                }


                const parentButton =
                    document.createElement(
                        "button"
                    );


                parentButton.className =
                    "category-parent-header";


                parentButton.innerHTML = `
                    <span>
                        ${
                            selectedParentCategory === parent
                                ? "▼"
                                : "▶"
                        }
                        ${escapeHTML(parent)}
                    </span>
                `;


                parentButton.addEventListener(
                    "click",
                    () => {

                        if (
                            selectedParentCategory ===
                            parent
                        ) {

                            selectedParentCategory =
                                null;


                            selectedSubCategory =
                                null;

                        } else {

                            selectedParentCategory =
                                parent;


                            selectedSubCategory =
                                null;

                        }


                        updateCategoryBreadcrumb();

                        loadProducts();

                    }
                );


                parentBox.appendChild(
                    parentButton
                );


                const childrenBox =
                    document.createElement(
                        "div"
                    );


                childrenBox.className =
                    "category-children";


                children.forEach(
                    child => {

                        const childButton =
                            document.createElement(
                                "button"
                            );


                        childButton.className =
                            "category-child-button";


                        if (
                            selectedParentCategory === parent &&
                            selectedSubCategory === child
                        ) {

                            childButton.classList.add(
                                "active"
                            );

                        }


                        childButton.textContent =
                            child;


                        childButton.addEventListener(
                            "click",
                            () => {

                                selectedParentCategory =
                                    parent;


                                selectedSubCategory =
                                    child;


                                updateCategoryBreadcrumb();

                                loadProducts();

                            }
                        );


                        childrenBox.appendChild(
                            childButton
                        );

                    }
                );


                parentBox.appendChild(
                    childrenBox
                );


                container.appendChild(
                    parentBox
                );

            }
        );

}


// ============================================================
// パンくず
// ============================================================

function updateCategoryBreadcrumb() {

    const element =
        document.getElementById(
            "category-breadcrumb"
        );


    if (!element) {
        return;
    }


    if (!selectedParentCategory) {

        element.textContent =
            "すべての商品";


        return;

    }


    if (!selectedSubCategory) {

        element.textContent =
            selectedParentCategory;


        return;

    }


    element.textContent =
        `${selectedParentCategory} ＞ ${selectedSubCategory}`;

}


// ============================================================
// カテゴリ選択肢
// ============================================================

function populateParentCategories(
    selectedParent = ""
) {

    const select =
        document.getElementById(
            "product-parent-category"
        );


    if (!select) {
        return;
    }


    select.innerHTML = "";


    Object.keys(categoryData)
        .forEach(
            parent => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    parent;


                option.textContent =
                    parent;


                if (
                    parent ===
                    selectedParent
                ) {

                    option.selected =
                        true;

                }


                select.appendChild(
                    option
                );

            }
        );


    populateSubCategories(
        selectedParent ||
        Object.keys(categoryData)[0]
    );

}


// ============================================================
// 小カテゴリ
// ============================================================

function populateSubCategories(
    parent,
    selectedSub = ""
) {

    const select =
        document.getElementById(
            "product-sub-category"
        );


    if (!select) {
        return;
    }


    select.innerHTML = "";


    const children =
        categoryData[parent] || [];


    children.forEach(
        child => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                child;


            option.textContent =
                child;


            if (
                child ===
                selectedSub
            ) {

                option.selected =
                    true;

            }


            select.appendChild(
                option
            );

        }
    );

}


// ============================================================
// 商品モーダル
// ============================================================

async function openProductModal(
    productId = null
) {

    const modal =
        document.getElementById(
            "product-modal"
        );


    const title =
        document.getElementById(
            "product-modal-title"
        );


    const name =
        document.getElementById(
            "product-name"
        );


    const price =
        document.getElementById(
            "product-price"
        );


    const stock =
        document.getElementById(
            "product-stock"
        );


    const imagePreview =
        document.getElementById(
            "image-preview"
        );


    const deleteButton =
        document.getElementById(
            "delete-product"
        );


    currentProductId =
        productId;


    if (productId) {

        const product =
            await getProduct(
                productId
            );


        if (!product) {
            return;
        }


        title.textContent =
            "商品を編集";


        name.value =
            product.name || "";


        price.value =
            product.price || 0;


        stock.value =
            product.stock || 0;


        populateParentCategories(
            product.parentCategory ||
            product.category ||
            "キーホルダー"
        );


        populateSubCategories(
            product.parentCategory ||
            product.category ||
            "キーホルダー",

            product.subCategory || ""
        );


        if (product.image) {

            imagePreview.innerHTML = `
                <img src="${product.image}">
            `;

        } else {

            imagePreview.innerHTML =
                "<span>画像なし</span>";

        }


        deleteButton.style.display =
            "block";


        deleteButton.disabled =
            false;

    } else {

        title.textContent =
            "商品を追加";


        name.value = "";

        price.value = "";

        stock.value = "";


        populateParentCategories(
            "キーホルダー"
        );


        imagePreview.innerHTML =
            "<span>画像なし</span>";


        deleteButton.style.display =
            "none";

    }


    document.getElementById(
        "product-image"
    ).value = "";


    modal.classList.add(
        "show"
    );

}


// ============================================================
// 商品モーダルを閉じる
// ============================================================

function closeProductModal() {

    const modal =
        document.getElementById(
            "product-modal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }


    currentProductId =
        null;

}


// ============================================================
// ファイル → Data URL
// ============================================================

function fileToDataURL(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload =
                () => {

                    resolve(
                        reader.result
                    );

                };


            reader.onerror =
                () => {

                    reject(
                        reader.error
                    );

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


// ============================================================
// 在庫履歴1件追加
// ============================================================

function addInventoryHistory(
    store,
    {
        productId,
        productName,
        type,
        delta,
        beforeStock,
        afterStock,
        reserved = 0,
        reason = "",
        memo = ""
    }
) {

    store.add({

        id:
            createId(),

        productId,

        productName,

        type,

        delta,

        beforeStock,

        afterStock,

        reserved,

        reason,

        memo,

        createdAt:
            new Date().toISOString()

    });

}


// ============================================================
// 商品保存
// ============================================================

async function saveProduct() {

    const editingProductId =
        currentProductId;


    const name =
        document.getElementById(
            "product-name"
        ).value.trim();


    const price =
        Number(
            document.getElementById(
                "product-price"
            ).value
        );


    const stock =
        Number(
            document.getElementById(
                "product-stock"
            ).value
        );


    const parentCategory =
        document.getElementById(
            "product-parent-category"
        ).value;


    const subCategory =
        document.getElementById(
            "product-sub-category"
        ).value;


    const imageInput =
        document.getElementById(
            "product-image"
        );


    if (!name) {

        alert(
            "商品名を入力してください。"
        );


        return;

    }


    if (
        !Number.isFinite(price) ||
        price < 0
    ) {

        alert(
            "価格を正しく入力してください。"
        );


        return;

    }


    if (
        !Number.isInteger(stock) ||
        stock < 0
    ) {

        alert(
            "在庫数は0以上の整数で入力してください。"
        );


        return;

    }


    let oldProduct = null;


    if (editingProductId) {

        oldProduct =
            await getProduct(
                editingProductId
            );


        if (!oldProduct) {

            alert(
                "商品が見つかりません。"
            );


            return;

        }


        const reserved =
            Number(
                oldProduct.reserved || 0
            );


        if (
            stock < reserved
        ) {

            alert(
                "在庫数を予約数より少なくすることはできません。\n\n" +
                `現在の予約数：${reserved}個`
            );


            return;

        }

    }


    let image =
        oldProduct?.image || null;


    if (
        imageInput.files &&
        imageInput.files.length > 0
    ) {

        image =
            await fileToDataURL(
                imageInput.files[0]
            );

    }


    const product = {

        id:
            editingProductId ||
            createId(),

        name,

        price,

        stock,

        reserved:
            oldProduct
                ? Number(
                    oldProduct.reserved || 0
                )
                : 0,

        parentCategory,

        subCategory,

        category:
            parentCategory,

        image,

        updatedAt:
            new Date().toISOString()

    };


    return new Promise(
        (resolve, reject) => {

            const storeNames =
                editingProductId

                    ? [
                        "products",
                        "inventoryHistory"
                    ]

                    : [
                        "products",
                        "inventoryHistory"
                    ];


            const transaction =
                db.transaction(
                    storeNames,
                    "readwrite"
                );


            const productStore =
                transaction.objectStore(
                    "products"
                );


            const historyStore =
                transaction.objectStore(
                    "inventoryHistory"
                );


            productStore.put(
                product
            );


            const oldStock =
                oldProduct
                    ? Number(
                        oldProduct.stock || 0
                    )
                    : 0;


            if (
                product.stock !==
                oldStock
            ) {

                addInventoryHistory(
                    historyStore,
                    {
                        productId:
                            product.id,

                        productName:
                            product.name,

                        type:
                            editingProductId
                                ? "product_edit"
                                : "initial",

                        delta:
                            product.stock -
                            oldStock,

                        beforeStock:
                            oldStock,

                        afterStock:
                            product.stock,

                        reserved:
                            product.reserved,

                        reason:
                            editingProductId
                                ? "商品編集"
                                : "商品登録",

                        memo:
                            ""

                    }
                );

            }


            transaction.oncomplete =
                () => {

                    closeProductModal();


                    loadProducts();

                    loadRegisterProducts();

                    loadInventory();


                    alert(
                        editingProductId
                            ? "商品を更新しました。"
                            : "商品を登録しました。"
                    );


                    resolve();

                };


            transaction.onerror =
                () => {

                    alert(
                        "商品保存に失敗しました。"
                    );


                    reject(
                        transaction.error
                    );

                };

        }
    );

}


// ============================================================
// 商品削除
// ============================================================

async function deleteProduct() {

    if (!currentProductId) {
        return;
    }


    const product =
        await getProduct(
            currentProductId
        );


    if (!product) {
        return;
    }


    if (
        Number(product.reserved || 0) > 0
    ) {

        alert(
            "予約が入っている商品は削除できません。"
        );


        return;

    }


    const ok =
        confirm(
            `「${product.name}」を削除しますか？`
        );


    if (!ok) {
        return;
    }


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    "products",
                    "readwrite"
                );


            transaction
                .objectStore(
                    "products"
                )
                .delete(
                    currentProductId
                );


            transaction.oncomplete =
                () => {

                    closeProductModal();


                    loadProducts();

                    loadRegisterProducts();

                    loadInventory();


                    alert(
                        "商品を削除しました。"
                    );


                    resolve();

                };


            transaction.onerror =
                () => {

                    alert(
                        "商品削除に失敗しました。"
                    );


                    reject(
                        transaction.error
                    );

                };

        }
    );

}


// ============================================================
// 予約一覧取得
// ============================================================

function getAllReservations() {

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    "reservations",
                    "readonly"
                );


            const request =
                transaction
                    .objectStore(
                        "reservations"
                    )
                    .getAll();


            request.onsuccess =
                () => {

                    resolve(
                        request.result || []
                    );

                };


            request.onerror =
                () => {

                    reject(
                        request.error
                    );

                };

        }
    );

}


// ============================================================
// 予約一覧表示
// ============================================================

async function loadReservations() {

    const container =
        document.getElementById(
            "reservation-list"
        );


    if (!container) {
        return;
    }


    const reservations =
        await getAllReservations();


    reservations.sort(
        (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
    );


    container.innerHTML = "";


    if (
        reservations.length === 0
    ) {

        container.innerHTML = `
            <div style="
                padding:40px;
                text-align:center;
                color:#999;
                background:white;
                border-radius:12px;
            ">
                予約はありません
            </div>
        `;


        return;

    }


    reservations.forEach(
        reservation => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "reservation-card";


            const statusClass =
                reservation.status ===
                "received"
                    ? "received"
                    : "";


            const statusText =
                reservation.status ===
                "received"
                    ? "受け渡し済み"
                    : "未受け取り";


            const itemsHTML =
                reservation.items
                    .map(
                        item => `

                            <div>

                                ${escapeHTML(
                                    item.name
                                )}

                                ×
                                ${item.quantity}

                               　

                                ${formatYen(
                                    item.price *
                                    item.quantity
                                )}

                            </div>

                        `
                    )
                    .join("");


            card.innerHTML = `

                <div class="reservation-card-header">

                    <div class="reservation-name">
                        ${escapeHTML(
                            reservation.name
                        )}
                    </div>


                    <div
                        class="
                            reservation-status
                            ${statusClass}
                        "
                    >
                        ${statusText}
                    </div>

                </div>


                <div class="reservation-items">

                    ${itemsHTML}

                </div>


                <div class="reservation-total-row">

                    <span>
                        合計
                    </span>


                    <span class="
                        reservation-total-price
                    ">
                        ${formatYen(
                            reservation.total
                        )}
                    </span>

                </div>


                ${
                    reservation.status !==
                    "received"

                        ? `
                            <button
                                class="
                                    reservation-receive-button
                                "
                                data-reservation-id="
                                    ${reservation.id}
                                "
                            >
                                受け渡し完了
                            </button>
                        `

                        : ""
                }

            `;


            const receiveButton =
                card.querySelector(
                    ".reservation-receive-button"
                );


            if (receiveButton) {

                receiveButton.addEventListener(
                    "click",
                    () => {

                        markReservationReceived(
                            reservation.id
                        );

                    }
                );

            }


            container.appendChild(
                card
            );

        }
    );

}


// ============================================================
// 予約商品一覧
// ============================================================

async function loadReservationProducts() {

    const container =
        document.getElementById(
            "reservation-product-list"
        );


    if (!container) {
        return;
    }


    const products =
        await getAllProducts();


    container.innerHTML = "";


    products.forEach(
        product => {

            const sellable =
                getSellableStock(
                    product
                );


            const selected =
                reservationCart.find(
                    item =>
                        item.productId ===
                        product.id
                );


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "reservation-product-card";


            if (selected) {

                card.classList.add(
                    "selected"
                );

            }


            card.innerHTML = `

                <div class="
                    reservation-product-image
                ">

                    ${
                        product.image

                            ? `
                                <img
                                    src="${product.image}"
                                    alt="${escapeHTML(
                                        product.name
                                    )}"
                                >
                            `

                            : `
                                <span>📦</span>
                            `
                    }

                </div>


                <div class="
                    reservation-product-info
                ">

                    <div class="
                        reservation-product-name
                    ">
                        ${escapeHTML(
                            product.name
                        )}
                    </div>


                    <div class="
                        reservation-product-price
                    ">
                        ${formatYen(
                            product.price
                        )}
                    </div>


                    <div
                        class="
                            reservation-product-stock
                            ${
                                sellable <= 0
                                    ? "stock-warning"
                                    : ""
                            }
                        "
                    >

                        ${
                            sellable > 0

                                ? `予約可能 ${sellable}個`

                                : "予約不可"
                        }

                    </div>

                </div>

            `;


            if (
                sellable > 0
            ) {

                card.addEventListener(
                    "click",
                    () => {

                        addToReservationCart(
                            product
                        );

                    }
                );

            } else {

                card.style.opacity =
                    "0.5";


                card.style.cursor =
                    "not-allowed";

            }


            container.appendChild(
                card
            );

        }
    );

}


// ============================================================
// 予約カート追加
// ============================================================

function addToReservationCart(
    product
) {

    const sellable =
        getSellableStock(
            product
        );


    const existing =
        reservationCart.find(
            item =>
                item.productId ===
                product.id
        );


    if (existing) {

        if (
            existing.quantity >=
            sellable
        ) {

            alert(
                "予約可能な在庫数を超えています。"
            );


            return;

        }


        existing.quantity++;

    } else {

        reservationCart.push({

            productId:
                product.id,

            name:
                product.name,

            price:
                Number(product.price),

            quantity:
                1

        });

    }


    renderReservationCart();

    loadReservationProducts();

}


// ============================================================
// 予約数量変更
// ============================================================

async function changeReservationQuantity(
    productId,
    delta
) {

    const item =
        reservationCart.find(
            item =>
                item.productId ===
                productId
        );


    if (!item) {
        return;
    }


    const product =
        await getProduct(
            productId
        );


    if (!product) {
        return;
    }


    const sellable =
        getSellableStock(
            product
        );


    item.quantity +=
        delta;


    if (
        item.quantity >
        sellable
    ) {

        item.quantity =
            sellable;

    }


    if (
        item.quantity <= 0
    ) {

        reservationCart =
            reservationCart.filter(
                item =>
                    item.productId !==
                    productId
            );

    }


    renderReservationCart();

    loadReservationProducts();

}


// ============================================================
// 予約合計
// ============================================================

function getReservationTotal() {

    return reservationCart.reduce(
        (total, item) =>
            total +
            item.price *
            item.quantity,

        0
    );

}


// ============================================================
// 予約カート表示
// ============================================================

function renderReservationCart() {

    const container =
        document.getElementById(
            "reservation-cart"
        );


    const totalElement =
        document.getElementById(
            "reservation-total"
        );


    if (!container) {
        return;
    }


    if (
        reservationCart.length === 0
    ) {

        container.innerHTML =
            "商品が選択されていません";

    } else {

        container.innerHTML = "";


        reservationCart.forEach(
            item => {

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "reservation-cart-item";


                row.innerHTML = `

                    <div class="
                        reservation-cart-item-name
                    ">

                        ${escapeHTML(
                            item.name
                        )}

                    </div>


                    <div class="
                        reservation-quantity-controls
                    ">

                        <button
                            class="
                                reservation-quantity-button
                            "
                            data-minus="
                                ${item.productId}
                            "
                        >
                            −
                        </button>


                        <span class="
                            reservation-quantity
                        ">
                            ${item.quantity}
                        </span>


                        <button
                            class="
                                reservation-quantity-button
                            "
                            data-plus="
                                ${item.productId}
                            "
                        >
                            ＋
                        </button>

                    </div>

                `;


                row.querySelector(
                    "[data-minus]"
                ).addEventListener(
                    "click",
                    () => {

                        changeReservationQuantity(
                            item.productId,
                            -1
                        );

                    }
                );


                row.querySelector(
                    "[data-plus]"
                ).addEventListener(
                    "click",
                    () => {

                        changeReservationQuantity(
                            item.productId,
                            1
                        );

                    }
                );


                container.appendChild(
                    row
                );

            }
        );

    }


    if (totalElement) {

        totalElement.textContent =
            formatYen(
                getReservationTotal()
            );

    }

}


// ============================================================
// 予約保存
// ============================================================

async function saveReservation() {

    const name =
        document.getElementById(
            "reservation-name"
        ).value.trim();


    if (!name) {

        alert(
            "予約者名を入力してください。"
        );


        return;

    }


    if (
        reservationCart.length === 0
    ) {

        alert(
            "商品を1つ以上選択してください。"
        );


        return;

    }


    const products =
        await getAllProducts();


    for (
        const item of reservationCart
    ) {

        const product =
            products.find(
                product =>
                    product.id ===
                    item.productId
            );


        if (!product) {

            alert(
                `商品「${item.name}」が見つかりません。`
            );


            return;

        }


        const sellable =
            getSellableStock(
                product
            );


        if (
            item.quantity >
            sellable
        ) {

            alert(
                `「${item.name}」の予約可能数が不足しています。`
            );


            return;

        }

    }


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    [
                        "products",
                        "reservations"
                    ],
                    "readwrite"
                );


            const productStore =
                transaction.objectStore(
                    "products"
                );


            const reservationStore =
                transaction.objectStore(
                    "reservations"
                );


            reservationCart.forEach(
                item => {

                    const product =
                        products.find(
                            product =>
                                product.id ===
                                item.productId
                        );


                    product.reserved =
                        Number(
                            product.reserved || 0
                        ) +
                        item.quantity;


                    productStore.put(
                        product
                    );

                }
            );


            const reservation = {

                id:
                    createId(),

                name,

                items:
                    reservationCart.map(
                        item => ({

                            productId:
                                item.productId,

                            name:
                                item.name,

                            price:
                                item.price,

                            quantity:
                                item.quantity

                        })
                    ),

                total:
                    getReservationTotal(),

                status:
                    "unreceived",

                createdAt:
                    new Date().toISOString()

            };


            reservationStore.add(
                reservation
            );


            transaction.oncomplete =
                () => {

                    reservationCart =
                        [];


                    closeReservationModal();


                    loadReservations();

                    loadProducts();

                    loadRegisterProducts();

                    loadInventory();


                    alert(
                        "予約を保存しました。"
                    );


                    resolve();

                };


            transaction.onerror =
                () => {

                    alert(
                        "予約の保存に失敗しました。"
                    );


                    reject(
                        transaction.error
                    );

                };

        }
    );

}


// ============================================================
// 予約受け渡し完了
// ============================================================

async function markReservationReceived(
    reservationId
) {

    const reservation =
        await new Promise(
            (resolve, reject) => {

                const transaction =
                    db.transaction(
                        "reservations",
                        "readonly"
                    );


                const request =
                    transaction
                        .objectStore(
                            "reservations"
                        )
                        .get(
                            reservationId
                        );


                request.onsuccess =
                    () => {

                        resolve(
                            request.result
                        );

                    };


                request.onerror =
                    () => {

                        reject(
                            request.error
                        );

                    };

            }
        );


    if (!reservation) {
        return;
    }


    if (
        reservation.status ===
        "received"
    ) {

        return;

    }


    const ok =
        confirm(
            `${reservation.name}さんの予約を\n受け渡し完了にしますか？`
        );


    if (!ok) {
        return;
    }


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    [
                        "products",
                        "reservations"
                    ],
                    "readwrite"
                );


            const productStore =
                transaction.objectStore(
                    "products"
                );


            reservation.items.forEach(
                item => {

                    const request =
                        productStore.get(
                            item.productId
                        );


                    request.onsuccess =
                        () => {

                            const product =
                                request.result;


                            if (!product) {
                                return;
                            }


                            product.reserved =
                                Math.max(
                                    0,
                                    Number(
                                        product.reserved ||
                                        0
                                    ) -
                                    Number(
                                        item.quantity ||
                                        0
                                    )
                                );


                            productStore.put(
                                product
                            );

                        };

                }
            );


            reservation.status =
                "received";


            reservation.receivedAt =
                new Date().toISOString();


            transaction
                .objectStore(
                    "reservations"
                )
                .put(
                    reservation
                );


            transaction.oncomplete =
                () => {

                    loadReservations();

                    loadProducts();

                    loadRegisterProducts();

                    loadInventory();


                    alert(
                        "受け渡しを完了しました。"
                    );


                    resolve();

                };


            transaction.onerror =
                () => {

                    alert(
                        "受け渡し処理に失敗しました。"
                    );


                    reject(
                        transaction.error
                    );

                };

        }
    );

}


// ============================================================
// レジ販売イベント取得
// ============================================================

async function getRegisterEvents() {

    const events =
        await getAllEvents();

    return events
        .filter(
            event =>
                event.status !== "completed"
        )
        .sort(
            (a, b) =>
                (a.date || "").localeCompare(
                    b.date || ""
                )
        );

}


// ============================================================
// レジ販売イベント選択欄
// ============================================================

async function ensureRegisterEventSelector() {

    const productList =
        document.getElementById(
            "register-product-list"
        );

    if (!productList) {
        return null;
    }


    let selector =
        document.getElementById(
            "register-event-selector"
        );


    if (!selector) {

        selector =
            document.createElement(
                "div"
            );

        selector.id =
            "register-event-selector";

        selector.style.cssText = `
            margin-bottom:20px;
            padding:15px;
            background:#fff8f0;
            border:1px solid #f0d8bd;
            border-radius:10px;
        `;


        selector.innerHTML = `

            <div
                style="
                    display:flex;
                    align-items:center;
                    gap:10px;
                    flex-wrap:wrap;
                "
            >

                <label
                    for="register-event-select"
                    style="
                        font-weight:bold;
                    "
                >
                    販売イベント
                </label>


                <select
                    id="register-event-select"
                    style="
                        min-width:220px;
                        padding:8px;
                        box-sizing:border-box;
                    "
                >
                    <option value="">
                        販売イベントなし
                    </option>
                </select>

            </div>


            <div
                id="register-event-note"
                style="
                    margin-top:8px;
                    font-size:13px;
                    color:#777;
                "
            >
                通常販売として処理します。
            </div>

        `;


        productList.parentNode.insertBefore(
            selector,
            productList
        );


        const select =
            document.getElementById(
                "register-event-select"
            );


        select.addEventListener(
            "change",
            async () => {

                selectedRegisterEventId =
                    select.value || "";


                /*
                 * イベントを変更した場合、
                 * 現在のカートをそのまま使うと
                 * 別イベントの商品として販売される
                 * 可能性があるため、一度空にする。
                 */

                if (
                    registerCart.length > 0
                ) {

                    const confirmed =
                        confirm(
                            "販売イベントを変更すると、現在のカートを空にします。\n\n" +
                            "変更しますか？"
                        );


                    if (!confirmed) {

                        select.value =
                            selectedRegisterEventId === ""
                                ? ""
                                : selectedRegisterEventId;

                        return;

                    }

                    registerCart = [];

                    renderRegisterCart();

                }


                await loadRegisterProducts();

            }
        );

    }


    const select =
        document.getElementById(
            "register-event-select"
        );


    if (!select) {
        return null;
    }


    const events =
        await getRegisterEvents();


    const currentValue =
        selectedRegisterEventId ||
        select.value ||
        "";


    select.innerHTML = `

        <option value="">
            販売イベントなし
        </option>

    `;


    events.forEach(
        event => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                event.id;


            option.textContent =
                `${event.name} ${
                    event.date
                        ? `（${event.date}）`
                        : ""
                }`;


            select.appendChild(
                option
            );

        }
    );


    const eventStillExists =
        events.some(
            event =>
                String(event.id) ===
                String(currentValue)
        );


    if (eventStillExists) {

        select.value =
            currentValue;

        selectedRegisterEventId =
            currentValue;

    } else {

        select.value =
            "";

        selectedRegisterEventId =
            "";

    }


    const note =
        document.getElementById(
            "register-event-note"
        );


    if (note) {

        if (
            selectedRegisterEventId
        ) {

            const selectedEvent =
                events.find(
                    event =>
                        String(event.id) ===
                        String(
                            selectedRegisterEventId
                        )
                );


            note.textContent =
                selectedEvent
                    ? `「${selectedEvent.name}」のイベント販売として記録します。`
                    : "イベント販売として記録します。";

        } else {

            note.textContent =
                "通常販売として処理します。";

        }

    }


    return selectedRegisterEventId;

}


// ============================================================
// イベント在庫取得
// ============================================================

async function getRegisterEventInventory(
    eventId
) {

    if (!eventId) {
        return [];
    }


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    ["eventInventory"],
                    "readonly"
                );


            const store =
                transaction.objectStore(
                    "eventInventory"
                );


            const request =
                store.getAll();


            request.onsuccess =
                () => {

                    const allData =
                        request.result || [];


                    const matchedData =
                        allData.filter(
                            item =>
                                String(
                                    item.eventId
                                ) ===
                                String(
                                    eventId
                                )
                        );


                    resolve(
                        matchedData
                    );

                };


            request.onerror =
                () => {

                    reject(
                        request.error
                    );

                };

        }
    );

}


// ============================================================
// イベント在庫マップ
// ============================================================

async function getRegisterEventInventoryMap(
    eventId
) {

    const inventory =
        await getRegisterEventInventory(
            eventId
        );


    const map =
        new Map();


    inventory.forEach(
        item => {

            map.set(
                String(
                    item.productId
                ),
                item
            );

        }
    );


    return map;

}


// ============================================================
// レジ商品一覧
// ============================================================

async function loadRegisterProducts() {

    const container =
        document.getElementById(
            "register-product-list"
        );

    if (!container) {
        return;
    }


    await ensureRegisterEventSelector();


    const eventId =
        selectedRegisterEventId ||
        document.getElementById(
            "register-event-select"
        )?.value ||
        "";


    selectedRegisterEventId =
        eventId;


    // ========================================================
    // 画面の基本部分を作成
    // ========================================================

    container.innerHTML = "";


    // ========================================================
    // 検索欄
    // ========================================================

    const searchArea =
        document.createElement(
            "div"
        );


    searchArea.style.cssText = `
        margin-bottom:15px;
    `;


    searchArea.innerHTML = `

        <input
            type="search"
            id="register-product-search"
            placeholder="商品名・キャラ名で検索"
            autocomplete="off"
            value="${escapeHTML(
                registerProductSearchText
            )}"
            style="
                width:100%;
                box-sizing:border-box;
                padding:12px 14px;
                border:1px solid #ccc;
                border-radius:10px;
                font-size:16px;
                background:#fff;
            "
        >

    `;


    container.appendChild(
        searchArea
    );


    const searchInput =
        searchArea.querySelector(
            "#register-product-search"
        );


    // ========================================================
    // 検索文字入力
    // ========================================================

    searchInput.addEventListener(
        "input",
        () => {

            registerProductSearchText =
                searchInput.value;


            // 商品一覧だけ更新
            // 検索欄自体は作り直さない
            updateRegisterProductList();

        }
    );


    // ========================================================
    // 大カテゴリ
    // ========================================================

    const categoryArea =
        document.createElement(
            "div"
        );


    categoryArea.style.cssText = `
        display:flex;
        gap:8px;
        flex-wrap:wrap;
        margin-bottom:10px;
    `;


    const parentCategories = [
        "すべて",
        ...Object.keys(
            categoryData
        )
    ];


    parentCategories.forEach(
        category => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.textContent =
                category;


            const isActive =
                category === "すべて"
                    ? registerProductCategory === ""
                    : registerProductCategory === category;


            button.style.cssText = `
                padding:8px 14px;
                border:1px solid #ddd;
                border-radius:20px;
                cursor:pointer;
                background:${
                    isActive
                        ? "#f28c28"
                        : "#fff"
                };
                color:${
                    isActive
                        ? "#fff"
                        : "#333"
                };
                font-size:14px;
            `;


            button.addEventListener(
                "click",
                () => {

                    if (
                        category === "すべて"
                    ) {

                        registerProductCategory =
                            "";

                        registerProductSubCategory =
                            "";

                    } else {

                        if (
                            registerProductCategory ===
                            category
                        ) {

                            registerProductCategory =
                                "";

                            registerProductSubCategory =
                                "";

                        } else {

                            registerProductCategory =
                                category;

                            registerProductSubCategory =
                                "";

                        }

                    }


                    loadRegisterProducts();

                }
            );


            categoryArea.appendChild(
                button
            );

        }
    );


    container.appendChild(
        categoryArea
    );


    // ========================================================
    // 小カテゴリ
    // ========================================================

    if (
        registerProductCategory &&
        categoryData[
            registerProductCategory
        ]
    ) {

        const subCategoryArea =
            document.createElement(
                "div"
            );


        subCategoryArea.style.cssText = `
            display:flex;
            gap:6px;
            flex-wrap:wrap;
            margin-bottom:12px;
            padding-left:8px;
        `;


        const subCategories = [
            "すべて",
            ...categoryData[
                registerProductCategory
            ]
        ];


        subCategories.forEach(
            subCategory => {

                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.textContent =
                    subCategory;


                const isActive =
                    subCategory === "すべて"
                        ? registerProductSubCategory === ""
                        : registerProductSubCategory === subCategory;


                button.style.cssText = `
                    padding:6px 12px;
                    border:1px solid #ddd;
                    border-radius:16px;
                    cursor:pointer;
                    background:${
                        isActive
                            ? "#666"
                            : "#fff"
                    };
                    color:${
                        isActive
                            ? "#fff"
                            : "#555"
                    };
                    font-size:13px;
                `;


                button.addEventListener(
                    "click",
                    () => {

                        if (
                            subCategory ===
                            "すべて"
                        ) {

                            registerProductSubCategory =
                                "";

                        } else {

                            if (
                                registerProductSubCategory ===
                                subCategory
                            ) {

                                registerProductSubCategory =
                                    "";

                            } else {

                                registerProductSubCategory =
                                    subCategory;

                            }

                        }


                        loadRegisterProducts();

                    }
                );


                subCategoryArea.appendChild(
                    button
                );

            }
        );


        container.appendChild(
            subCategoryArea
        );

    }


    // ========================================================
    // 商品一覧用エリア
    // ========================================================

    const productArea =
        document.createElement(
            "div"
        );


    productArea.id =
        "register-product-result";


    container.appendChild(
        productArea
    );


    // ========================================================
    // 商品一覧を表示
    // ========================================================

    await updateRegisterProductList();

}



// ============================================================
// レジ商品一覧を更新
// ============================================================

async function updateRegisterProductList() {

    const productArea =
        document.getElementById(
            "register-product-result"
        );


    if (!productArea) {
        return;
    }


    const eventId =
        selectedRegisterEventId ||
        document.getElementById(
            "register-event-select"
        )?.value ||
        "";


    // ========================================================
    // 商品取得
    // ========================================================

    const products =
        await getAllProducts();


    // ========================================================
    // イベント在庫
    // ========================================================

    let eventInventoryMap =
        new Map();


    if (eventId) {

        eventInventoryMap =
            await getRegisterEventInventoryMap(
                eventId
            );

    }


    // ========================================================
    // 販売可能数を計算
    // ========================================================

    const registerProducts =
        products
            .map(
                product => {

                    let sellable = 0;


                    if (eventId) {

                        const eventInventory =
                            eventInventoryMap.get(
                                String(
                                    product.id
                                )
                            );


                        if (eventInventory) {

                            const startQuantity =
                                Math.max(
                                    0,
                                    Number(
                                        eventInventory.quantity ||
                                        0
                                    )
                                );


                            const soldQuantity =
                                Math.max(
                                    0,
                                    Number(
                                        eventInventory.soldQuantity ||
                                        0
                                    )
                                );


                            sellable =
                                Math.max(
                                    0,
                                    startQuantity -
                                    soldQuantity
                                );

                        }

                    } else {

                        sellable =
                            getSellableStock(
                                product
                            );

                    }


                    return {
                        product,
                        sellable
                    };

                }
            )
            .filter(
                item =>
                    item.sellable > 0
            );


    // ========================================================
    // 検索・カテゴリで絞り込み
    // ========================================================

    const searchText =
        String(
            registerProductSearchText ||
            ""
        )
            .trim()
            .toLowerCase();


    let filteredProducts =
        registerProducts;


    // --------------------------------------------------------
    // 大カテゴリ
    // --------------------------------------------------------

    if (
        registerProductCategory
    ) {

        filteredProducts =
            filteredProducts.filter(
                item => {

                    const product =
                        item.product;


                    return (
                        String(
                            product.parentCategory ||
                            product.category ||
                            ""
                        ) ===
                        String(
                            registerProductCategory
                        )
                    );

                }
            );

    }


    // --------------------------------------------------------
    // 小カテゴリ
    // --------------------------------------------------------

    if (
        registerProductSubCategory
    ) {

        filteredProducts =
            filteredProducts.filter(
                item => {

                    const product =
                        item.product;


                    return (
                        String(
                            product.subCategory ||
                            ""
                        ) ===
                        String(
                            registerProductSubCategory
                        )
                    );

                }
            );

    }


    // --------------------------------------------------------
    // 商品名・カテゴリ検索
    // --------------------------------------------------------

    if (
        searchText
    ) {

        filteredProducts =
            filteredProducts.filter(
                item => {

                    const product =
                        item.product;


                    const searchableText =
                        [
                            product.name,
                            product.parentCategory,
                            product.subCategory
                        ]
                            .filter(
                                value =>
                                    value !==
                                    undefined &&
                                    value !==
                                    null
                            )
                            .join(" ")
                            .toLowerCase();


                    return searchableText.includes(
                        searchText
                    );

                }
            );

    }


    // ========================================================
    // 商品結果エリアだけ作り直す
    // ========================================================

    productArea.innerHTML = "";


    // ========================================================
    // 件数表示
    // ========================================================

    const resultInfo =
        document.createElement(
            "div"
        );


    resultInfo.style.cssText = `
        margin-bottom:10px;
        color:#777;
        font-size:13px;
    `;


    resultInfo.textContent =
        `${filteredProducts.length}商品を表示`;


    productArea.appendChild(
        resultInfo
    );


    // ========================================================
    // 商品がない場合
    // ========================================================

    if (
        filteredProducts.length === 0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.style.cssText = `
            padding:30px 10px;
            text-align:center;
            color:#999;
        `;


        if (
            registerProducts.length === 0
        ) {

            empty.textContent =
                eventId
                    ? "このイベントに販売可能な商品がありません。"
                    : "販売可能な商品がありません。";

        } else {

            empty.textContent =
                "条件に一致する商品がありません。";

        }


        productArea.appendChild(
            empty
        );


        return;

    }


    // ========================================================
    // 商品カード
    // ========================================================

    filteredProducts.forEach(
        item => {

            const product =
                item.product;


            const sellable =
                item.sellable;


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "register-product-card";


            card.innerHTML = `

                ${
                    product.image

                        ? `
                            <img
                                src="${product.image}"
                                class="
                                    register-product-image
                                "
                                alt="${escapeHTML(
                                    product.name
                                )}"
                            >
                        `

                        : `
                            <div
                                class="
                                    register-product-image
                                "
                            ></div>
                        `
                }


                <div class="
                    register-product-info
                ">

                    <div class="
                        register-product-name
                    ">
                        ${escapeHTML(
                            product.name
                        )}
                    </div>


                    <div class="
                        register-product-price
                    ">
                        ${formatYen(
                            product.price
                        )}
                    </div>


                    <div class="
                        register-product-stock
                    ">

                        販売可能 ${sellable}個

                    </div>

                </div>

            `;


            card.addEventListener(
                "click",
                () => {

                    addToRegisterCart(
                        product
                    );

                }
            );


            productArea.appendChild(
                card
            );

        }
    );

}
// ============================================================
// レジ販売可能数取得
// ============================================================

async function getRegisterSellableQuantity(
    productId
) {

    const eventId =
        selectedRegisterEventId ||
        document.getElementById(
            "register-event-select"
        )?.value ||
        "";


    if (!eventId) {

        const product =
            await getProduct(
                productId
            );


        if (!product) {
            return 0;
        }


        return getSellableStock(
            product
        );

    }


    const inventoryMap =
        await getRegisterEventInventoryMap(
            eventId
        );


    const inventory =
        inventoryMap.get(
            String(productId)
        );


    if (!inventory) {
        return 0;
    }


    const startQuantity =
        Math.max(
            0,
            Number(
                inventory.quantity || 0
            )
        );


    const soldQuantity =
        Math.max(
            0,
            Number(
                inventory.soldQuantity || 0
            )
        );


    return Math.max(
        0,
        startQuantity -
        soldQuantity
    );

}


// ============================================================
// レジカート追加
// ============================================================

async function addToRegisterCart(
    product
) {

    const sellable =
        await getRegisterSellableQuantity(
            product.id
        );


    if (
        sellable <= 0
    ) {

        return;

    }


    const existing =
        registerCart.find(
            item =>
                item.productId ===
                product.id
        );


    if (existing) {

        if (
            existing.quantity >=
            sellable
        ) {

            alert(
                "販売可能な在庫数を超えています。"
            );


            return;

        }


        existing.quantity++;

    } else {

        registerCart.push({

            productId:
                product.id,

            name:
                product.name,

            price:
                Number(
                    product.price
                ),

            quantity:
                1

        });

    }


    renderRegisterCart();

}


// ============================================================
// レジ数量変更
// ============================================================

async function changeRegisterQuantity(
    productId,
    delta
) {

    const item =
        registerCart.find(
            item =>
                item.productId ===
                productId
        );


    if (!item) {
        return;
    }


    const product =
        await getProduct(
            productId
        );


    if (!product) {
        return;
    }


    const sellable =
        await getRegisterSellableQuantity(
            productId
        );


    item.quantity +=
        delta;


    if (
        item.quantity >
        sellable
    ) {

        item.quantity =
            sellable;

    }


    if (
        item.quantity <= 0
    ) {

        registerCart =
            registerCart.filter(
                item =>
                    item.productId !==
                    productId
            );

    }


    renderRegisterCart();

}


// ============================================================
// レジ合計
// ============================================================

function getRegisterTotal() {

    return registerCart.reduce(
        (total, item) =>
            total +
            item.price *
            item.quantity,

        0
    );

}


// ============================================================
// レジカート表示
// ============================================================

function renderRegisterCart() {

    const container =
        document.getElementById(
            "register-cart"
        );


    const totalElement =
        document.getElementById(
            "register-total"
        );


    if (!container) {
        return;
    }


    if (
        registerCart.length === 0
    ) {

        container.innerHTML = `
            <p class="empty-cart">
                商品を選択してください
            </p>
        `;

    } else {

        container.innerHTML = "";


        registerCart.forEach(
            item => {

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "register-cart-item";


                row.innerHTML = `

                    <div>

                        <div class="
                            register-cart-item-name
                        ">
                            ${escapeHTML(
                                item.name
                            )}
                        </div>


                        <div class="
                            register-cart-item-price
                        ">
                            ${formatYen(
                                item.price
                            )}
                            ×
                            ${item.quantity}
                        </div>

                    </div>


                    <div class="
                        register-cart-controls
                    ">

                        <button
                            type="button"
                            data-minus="${item.productId}"
                        >
                            −
                        </button>


                        <span class="
                            register-cart-quantity
                        ">
                            ${item.quantity}
                        </span>


                        <button
                            type="button"
                            data-plus="${item.productId}"
                        >
                            ＋
                        </button>

                    </div>

                `;


                row.querySelector(
                    "[data-minus]"
                ).addEventListener(
                    "click",
                    () => {

                        changeRegisterQuantity(
                            item.productId,
                            -1
                        );

                    }
                );


                row.querySelector(
                    "[data-plus]"
                ).addEventListener(
                    "click",
                    () => {

                        changeRegisterQuantity(
                            item.productId,
                            1
                        );

                    }
                );


                container.appendChild(
                    row
                );

            }
        );

    }


    if (totalElement) {

        totalElement.textContent =
            formatYen(
                getRegisterTotal()
            );

    }


    updateRegisterChange();

}


// ============================================================
// お釣り計算
// ============================================================

function updateRegisterChange() {

    const total =
        getRegisterTotal();


    const cashInput =
        document.getElementById(
            "cash-received"
        );


    const changeElement =
        document.getElementById(
            "cash-change"
        );


    const completeButton =
        document.getElementById(
            "complete-sale"
        );


    if (
        !cashInput ||
        !changeElement ||
        !completeButton
    ) {

        return;

    }


    const cash =
        Number(
            cashInput.value || 0
        );


    const change =
        Math.max(
            0,
            cash - total
        );


    changeElement.textContent =
        formatYen(
            change
        );


    completeButton.disabled =
        registerCart.length === 0 ||
        cash < total;

}


// ============================================================
// イベント販売在庫取得
// ============================================================

async function getEventInventoryRecord(
    eventId,
    productId
) {

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    ["eventInventory"],
                    "readonly"
                );


            const store =
                transaction.objectStore(
                    "eventInventory"
                );


            const request =
                store.get(
                    String(eventId) +
                    "_" +
                    String(productId)
                );


            request.onsuccess =
                () => {

                    resolve(
                        request.result ||
                        null
                    );

                };


            request.onerror =
                () => {

                    reject(
                        request.error
                    );

                };

        }
    );

}


// ============================================================
// 販売確定
// ============================================================

async function completeSale() {

    if (
        registerCart.length === 0
    ) {

        return;

    }


    const total =
        getRegisterTotal();


    const cashInput =
        document.getElementById(
            "cash-received"
        );


    const cashReceived =
        Number(
            cashInput.value || 0
        );


    if (
        cashReceived < total
    ) {

        alert(
            "預かり金が不足しています。"
        );


        return;

    }


    const eventId =
        selectedRegisterEventId ||
        document.getElementById(
            "register-event-select"
        )?.value ||
        "";


    selectedRegisterEventId =
        eventId;


    let selectedEvent =
        null;


    if (eventId) {

        selectedEvent =
            await getEventById(
                eventId
            );


        if (!selectedEvent) {

            alert(
                "選択された販売イベントが見つかりません。"
            );


            await loadRegisterProducts();


            return;

        }


        if (
            selectedEvent.status ===
            "completed"
        ) {

            alert(
                "終了済みのイベントは販売イベントとして選択できません。"
            );


            selectedRegisterEventId =
                "";


            const select =
                document.getElementById(
                    "register-event-select"
                );


            if (select) {
                select.value = "";
            }


            await loadRegisterProducts();


            return;

        }

    }


    const products =
        await getAllProducts();


    /*
     * --------------------------------------------------------
     * 販売可能数を再確認
     * --------------------------------------------------------
     */

    const eventInventoryMap =
        eventId
            ? await getRegisterEventInventoryMap(
                eventId
            )
            : new Map();


    for (
        const item of registerCart
    ) {

        const product =
            products.find(
                product =>
                    String(
                        product.id
                    ) ===
                    String(
                        item.productId
                    )
            );


        if (!product) {

            alert(
                `商品「${item.name}」が見つかりません。`
            );


            return;

        }


        let sellable = 0;


        if (eventId) {

            const inventory =
                eventInventoryMap.get(
                    String(
                        item.productId
                    )
                );


            if (!inventory) {

                alert(
                    `「${item.name}」は、このイベントの開始在庫に登録されていません。`
                );


                await loadRegisterProducts();


                return;

            }


            const startQuantity =
                Math.max(
                    0,
                    Number(
                        inventory.quantity ||
                        0
                    )
                );


            const soldQuantity =
                Math.max(
                    0,
                    Number(
                        inventory.soldQuantity ||
                        0
                    )
                );


            sellable =
                Math.max(
                    0,
                    startQuantity -
                    soldQuantity
                );

        } else {

            sellable =
                getSellableStock(
                    product
                );

        }


        if (
            item.quantity >
            sellable
        ) {

            alert(
                `「${item.name}」の販売可能数が不足しています。\n\n` +
                `販売可能数：${sellable}個`
            );


            await loadRegisterProducts();


            return;

        }

    }


    const change =
        cashReceived -
        total;


    const sale = {

        id:
            createId(),

        items:
            registerCart.map(
                item => ({

                    productId:
                        item.productId,

                    name:
                        item.name,

                    price:
                        item.price,

                    quantity:
                        item.quantity

                })
            ),

        total,

        cashReceived,

        change,

        createdAt:
            new Date().toISOString(),

        type:
            "sale",

        eventId:
            eventId || null,

        eventName:
            selectedEvent
                ? selectedEvent.name
                : null

    };


    /*
     * --------------------------------------------------------
     * 通常販売
     * --------------------------------------------------------
     */

    if (!eventId) {

        return new Promise(
            (resolve, reject) => {

                const transaction =
                    db.transaction(
                        [
                            "products",
                            "sales",
                            "inventoryHistory"
                        ],
                        "readwrite"
                    );


                const productStore =
                    transaction.objectStore(
                        "products"
                    );


                const salesStore =
                    transaction.objectStore(
                        "sales"
                    );


                const historyStore =
                    transaction.objectStore(
                        "inventoryHistory"
                    );


                registerCart.forEach(
                    item => {

                        const product =
                            products.find(
                                product =>
                                    String(
                                        product.id
                                    ) ===
                                    String(
                                        item.productId
                                    )
                            );


                        const beforeStock =
                            Number(
                                product.stock || 0
                            );


                        product.stock =
                            beforeStock -
                            item.quantity;


                        product.updatedAt =
                            new Date().toISOString();


                        productStore.put(
                            product
                        );


                        addInventoryHistory(
                            historyStore,
                            {

                                productId:
                                    product.id,

                                productName:
                                    product.name,

                                type:
                                    "sale",

                                delta:
                                    -item.quantity,

                                beforeStock,

                                afterStock:
                                    product.stock,

                                reserved:
                                    Number(
                                        product.reserved ||
                                        0
                                    ),

                                reason:
                                    "販売",

                                memo:
                                    ""

                            }
                        );

                    }
                );


                salesStore.add(
                    sale
                );


                transaction.oncomplete =
                    () => {

                        registerCart =
                            [];


                        cashInput.value =
                            "";


                        renderRegisterCart();

                        loadRegisterProducts();

                        loadProducts();

                        loadInventory();


                        alert(
                            "販売を確定しました。\n\n" +
                            `合計：${formatYen(total)}\n` +
                            `預かり：${formatYen(cashReceived)}\n` +
                            `お釣り：${formatYen(change)}`
                        );


                        resolve();

                    };


                transaction.onerror =
                    () => {

                        alert(
                            "販売処理に失敗しました。"
                        );


                        reject(
                            transaction.error
                        );

                    };

            }
        );

    }


    /*
     * --------------------------------------------------------
     * イベント販売
     *
     * イベント開始時点ですでにマスター在庫から
     * イベント持ち出し分を引いているため、
     * ここでは products.stock を変更しない。
     *
     * eventInventory.soldQuantity のみ増やす。
     * --------------------------------------------------------
     */

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    [
                        "sales",
                        "eventInventory"
                    ],
                    "readwrite"
                );


            const salesStore =
                transaction.objectStore(
                    "sales"
                );


            const eventInventoryStore =
                transaction.objectStore(
                    "eventInventory"
                );


            registerCart.forEach(
                item => {

                    const inventory =
                        eventInventoryMap.get(
                            String(
                                item.productId
                            )
                        );


                    if (!inventory) {

                        transaction.abort();


                        reject(
                            new Error(
                                `イベント在庫が見つかりません：${item.name}`
                            )
                        );


                        return;

                    }


                    const startQuantity =
                        Math.max(
                            0,
                            Number(
                                inventory.quantity ||
                                0
                            )
                        );


                    const currentSoldQuantity =
                        Math.max(
                            0,
                            Number(
                                inventory.soldQuantity ||
                                0
                            )
                        );


                    const newSoldQuantity =
                        currentSoldQuantity +
                        item.quantity;


                    if (
                        newSoldQuantity >
                        startQuantity
                    ) {

                        transaction.abort();


                        reject(
                            new Error(
                                `イベント在庫を超えて販売しようとしています：${item.name}`
                            )
                        );


                        return;

                    }


                    inventory.soldQuantity =
                        newSoldQuantity;


                    eventInventoryStore.put(
                        inventory
                    );

                }
            );


            salesStore.add(
                sale
            );


            transaction.oncomplete =
                async () => {

                    registerCart =
                        [];


                    cashInput.value =
                        "";


                    renderRegisterCart();


await loadRegisterProducts();


await loadProducts();

await loadInventory();


/*
 * イベント販売状況を更新
 */

await loadEventStartInventory(
    eventId
);


/*
 * 売上表示を更新
 */

await loadEventSalesSummary(
    eventId
);


/*
 * 利益集計も更新
 */

await loadEventProfitSummary(
    eventId
);

                    alert(
                        "イベント販売を確定しました。\n\n" +
                        `イベント：${selectedEvent?.name || ""}\n` +
                        `合計：${formatYen(total)}\n` +
                        `預かり：${formatYen(cashReceived)}\n` +
                        `お釣り：${formatYen(change)}`
                    );


                    resolve();

                };


            transaction.onerror =
                () => {

                    alert(
                        "イベント販売処理に失敗しました。"
                    );


                    reject(
                        transaction.error
                    );

                };


            transaction.onabort =
                () => {

                    if (
                        transaction.error
                    ) {

                        reject(
                            transaction.error
                        );

                    }

                };

        }
    );

}

// ============================================================
// 在庫修正モーダルを作成
// ============================================================

function createInventoryAdjustModal() {

    if (
        document.getElementById(
            "inventory-adjust-modal"
        )
    ) {

        return;

    }


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "inventory-adjust-modal";


    modal.className =
        "modal";


    modal.innerHTML = `

        <div
            class="modal-content"
            style="
                max-width:520px;
            "
        >

            <div class="modal-header">

                <h2>
                    在庫を修正
                </h2>


                <button
                    id="close-inventory-adjust-modal"
                    class="close-button"
                    type="button"
                >
                    ×
                </button>

            </div>


            <div
                style="
                    padding:12px 14px;
                    background:#fff7ef;
                    border-radius:10px;
                    margin-bottom:18px;
                "
            >

                <div
                    id="inventory-adjust-product-name"
                    style="
                        font-size:18px;
                        font-weight:bold;
                        margin-bottom:10px;
                    "
                ></div>


                <div
                    style="
                        display:grid;
                        grid-template-columns:
                            1fr 1fr 1fr;
                        gap:8px;
                        text-align:center;
                    "
                >

                    <div>

                        <div
                            style="
                                font-size:12px;
                                color:#888;
                            "
                        >
                            現在の在庫
                        </div>

                        <strong
                            id="inventory-current-stock"
                        >
                            0
                        </strong>

                    </div>


                    <div>

                        <div
                            style="
                                font-size:12px;
                                color:#888;
                            "
                        >
                            予約確保
                        </div>

                        <strong
                            id="inventory-reserved-stock"
                        >
                            0
                        </strong>

                    </div>


                    <div>

                        <div
                            style="
                                font-size:12px;
                                color:#888;
                            "
                        >
                            販売可能
                        </div>

                        <strong
                            id="inventory-current-sellable"
                        >
                            0
                        </strong>

                    </div>

                </div>

            </div>


            <div class="form-group">

                <label
                    for="inventory-new-stock"
                >
                    修正後の在庫数
                </label>


                <input
                    type="number"
                    id="inventory-new-stock"
                    min="0"
                    step="1"
                    inputmode="numeric"
                    placeholder="0"
                >

            </div>


            <div
                id="inventory-adjust-difference"
                style="
                    margin:10px 0 18px;
                    font-weight:bold;
                "
            >
                増減：0個
            </div>


            <div class="form-group">

                <label
                    for="inventory-adjust-reason"
                >
                    修正理由
                </label>


                <select
                    id="inventory-adjust-reason"
                >

                    <option value="破損・不良">
                        破損・不良
                    </option>

                    <option value="紛失">
                        紛失
                    </option>

                    <option value="追加補充">
                        追加補充
                    </option>

                    <option value="数え間違い">
                        数え間違い
                    </option>

                    <option value="その他">
                        その他
                    </option>

                </select>

            </div>


            <div class="form-group">

                <label
                    for="inventory-adjust-memo"
                >
                    メモ
                </label>


                <textarea
                    id="inventory-adjust-memo"
                    rows="3"
                    placeholder="必要ならメモを入力"
                    style="
                        width:100%;
                        box-sizing:border-box;
                        resize:vertical;
                    "
                ></textarea>

            </div>


            <div class="modal-buttons">

                <button
                    id="cancel-inventory-adjust"
                    class="secondary-button"
                    type="button"
                >
                    キャンセル
                </button>


                <button
                    id="save-inventory-adjust"
                    class="primary-button"
                    type="button"
                >
                    在庫を修正
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    document
        .getElementById(
            "close-inventory-adjust-modal"
        )
        .addEventListener(
            "click",
            closeInventoryAdjustModal
        );


    document
        .getElementById(
            "cancel-inventory-adjust"
        )
        .addEventListener(
            "click",
            closeInventoryAdjustModal
        );


    document
        .getElementById(
            "save-inventory-adjust"
        )
        .addEventListener(
            "click",
            saveInventoryAdjustment
        );


    document
        .getElementById(
            "inventory-new-stock"
        )
        .addEventListener(
            "input",
            updateInventoryAdjustDifference
        );

}


// ============================================================
// 在庫修正モーダルを開く
// ============================================================

async function openInventoryAdjustModal(
    productId
) {

    createInventoryAdjustModal();


    const product =
        await getProduct(
            productId
        );


    if (!product) {

        alert(
            "商品が見つかりません。"
        );


        return;

    }


    inventoryAdjustProductId =
        productId;


    document.getElementById(
        "inventory-adjust-product-name"
    ).textContent =
        product.name;


    document.getElementById(
        "inventory-current-stock"
    ).textContent =
        Number(
            product.stock || 0
        );


    document.getElementById(
        "inventory-reserved-stock"
    ).textContent =
        Number(
            product.reserved || 0
        );


    document.getElementById(
        "inventory-current-sellable"
    ).textContent =
        getSellableStock(
            product
        );


    document.getElementById(
        "inventory-new-stock"
    ).value =
        Number(
            product.stock || 0
        );


    document.getElementById(
        "inventory-adjust-reason"
    ).value =
        "数え間違い";


    document.getElementById(
        "inventory-adjust-memo"
    ).value =
        "";


    updateInventoryAdjustDifference();


    document.getElementById(
        "inventory-adjust-modal"
    ).classList.add(
        "show"
    );

}


// ============================================================
// 在庫修正モーダルを閉じる
// ============================================================

function closeInventoryAdjustModal() {

    const modal =
        document.getElementById(
            "inventory-adjust-modal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }


    inventoryAdjustProductId =
        null;

}


// ============================================================
// 在庫修正の増減表示
// ============================================================

async function updateInventoryAdjustDifference() {

    if (
        !inventoryAdjustProductId
    ) {

        return;

    }


    const product =
        await getProduct(
            inventoryAdjustProductId
        );


    if (!product) {
        return;
    }


    const newStock =
        Number(
            document.getElementById(
                "inventory-new-stock"
            ).value
        );


    const difference =
        newStock -
        Number(
            product.stock || 0
        );


    const element =
        document.getElementById(
            "inventory-adjust-difference"
        );


    if (!element) {
        return;
    }


    if (
        difference > 0
    ) {

        element.textContent =
            `増減：＋${difference}個`;

    } else if (
        difference < 0
    ) {

        element.textContent =
            `増減：${difference}個`;

    } else {

        element.textContent =
            "増減：0個";

    }

}


// ============================================================
// 在庫修正保存
// ============================================================

async function saveInventoryAdjustment() {

    if (
        !inventoryAdjustProductId
    ) {

        return;

    }


    const product =
        await getProduct(
            inventoryAdjustProductId
        );


    if (!product) {

        alert(
            "商品が見つかりません。"
        );


        return;

    }


    const newStock =
        Number(
            document.getElementById(
                "inventory-new-stock"
            ).value
        );


    const reserved =
        Number(
            product.reserved || 0
        );


    if (
        !Number.isInteger(newStock) ||
        newStock < 0
    ) {

        alert(
            "在庫数は0以上の整数で入力してください。"
        );


        return;

    }


    if (
        newStock < reserved
    ) {

        alert(
            "修正後の在庫数を予約確保数より少なくすることはできません。\n\n" +
            `予約確保：${reserved}個`
        );


        return;

    }


    const beforeStock =
        Number(
            product.stock || 0
        );


    const delta =
        newStock -
        beforeStock;


    if (
        delta === 0
    ) {

        alert(
            "在庫数が変更されていません。"
        );


        return;

    }


    const reason =
        document.getElementById(
            "inventory-adjust-reason"
        ).value;


    const memo =
        document.getElementById(
            "inventory-adjust-memo"
        ).value.trim();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    [
                        "products",
                        "inventoryHistory"
                    ],
                    "readwrite"
                );


            const productStore =
                transaction.objectStore(
                    "products"
                );


            const historyStore =
                transaction.objectStore(
                    "inventoryHistory"
                );


            product.stock =
                newStock;


            product.updatedAt =
                new Date().toISOString();


            productStore.put(
                product
            );


            addInventoryHistory(
                historyStore,
                {

                    productId:
                        product.id,

                    productName:
                        product.name,

                    type:
                        "adjustment",

                    delta,

                    beforeStock,

                    afterStock:
                        newStock,

                    reserved,

                    reason,

                    memo

                }
            );


            transaction.oncomplete =
                () => {

                    closeInventoryAdjustModal();


                    loadInventory();

                    loadProducts();

                    loadRegisterProducts();


                    alert(
                        "在庫を修正しました。"
                    );


                    resolve();

                };


            transaction.onerror =
                () => {

                    alert(
                        "在庫修正に失敗しました。"
                    );


                    reject(
                        transaction.error
                    );

                };

        }
    );

}


// ============================================================
// 在庫一覧
// ============================================================

async function loadInventory() {

    const container =
        document.getElementById(
            "inventory-list"
        );


    if (!container) {
        return;
    }


    const products =
        await getAllProducts();


    // --------------------------------------------------------
    // 集計
    // --------------------------------------------------------

    const productCount =
        products.length;


    const totalStock =
        products.reduce(
            (sum, product) =>
                sum +
                Number(
                    product.stock || 0
                ),

            0
        );


    const totalReserved =
        products.reduce(
            (sum, product) =>
                sum +
                Number(
                    product.reserved || 0
                ),

            0
        );


    const totalSellable =
        products.reduce(
            (sum, product) =>
                sum +
                getSellableStock(
                    product
                ),

            0
        );


    const countElement =
        document.getElementById(
            "inventory-product-count"
        );


    const stockElement =
        document.getElementById(
            "inventory-total-stock"
        );


    const reservedElement =
        document.getElementById(
            "inventory-total-reserved"
        );


    const sellableElement =
        document.getElementById(
            "inventory-total-sellable"
        );


    if (countElement) {

        countElement.textContent =
            productCount;

    }


    if (stockElement) {

        stockElement.textContent =
            totalStock;

    }


    if (reservedElement) {

        reservedElement.textContent =
            totalReserved;

    }


    if (sellableElement) {

        sellableElement.textContent =
            totalSellable;

    }


    // --------------------------------------------------------
    // 商品一覧
    // --------------------------------------------------------

    container.innerHTML = "";


    if (
        products.length === 0
    ) {

        container.innerHTML = `
            <div style="
                text-align:center;
                color:#999;
                padding:30px;
                background:white;
                border-radius:12px;
            ">
                商品がありません
            </div>
        `;


        await loadInventoryHistory();


        return;

    }


    products.sort(
        (a, b) =>
            String(a.name || "")
                .localeCompare(
                    String(b.name || ""),
                    "ja"
                )
    );


    products.forEach(
        product => {

            const stock =
                Number(
                    product.stock || 0
                );


            const reserved =
                Number(
                    product.reserved || 0
                );


            const sellable =
                getSellableStock(
                    product
                );


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "inventory-item";


            row.style.cssText = `
                display:grid;
                grid-template-columns:
                    minmax(0,1fr)
                    80px
                    80px
                    90px
                    auto;
                gap:12px;
                align-items:center;
                padding:14px 10px;
                border-bottom:1px solid #eee;
                background:white;
            `;


            let sellableClass = "";


            if (
                sellable <= 0
            ) {

                sellableClass =
                    "color:#c62828;";

            } else if (
                sellable <= 3
            ) {

                sellableClass =
                    "color:#e67e22;";

            }


            row.innerHTML = `

                <div
                    style="
                        min-width:0;
                    "
                >

                    <div
                        style="
                            font-weight:bold;
                            overflow:hidden;
                            text-overflow:ellipsis;
                            white-space:nowrap;
                        "
                    >
                        ${escapeHTML(
                            product.name
                        )}
                    </div>


                    ${
                        product.subCategory

                            ? `
                                <div
                                    style="
                                        font-size:11px;
                                        color:#999;
                                        margin-top:3px;
                                    "
                                >
                                    ${escapeHTML(
                                        product.parentCategory ||
                                        product.category ||
                                        ""
                                    )}
                                    ＞
                                    ${escapeHTML(
                                        product.subCategory
                                    )}
                                </div>
                            `

                            : ""
                    }

                </div>


                <div
                    style="
                        text-align:center;
                    "
                >

                    <small
                        style="
                            display:block;
                            color:#888;
                            font-size:11px;
                        "
                    >
                        在庫
                    </small>


                    <strong>
                        ${stock}
                    </strong>

                </div>


                <div
                    style="
                        text-align:center;
                    "
                >

                    <small
                        style="
                            display:block;
                            color:#888;
                            font-size:11px;
                        "
                    >
                        予約
                    </small>


                    <strong>
                        ${reserved}
                    </strong>

                </div>


                <div
                    style="
                        text-align:center;
                        ${sellableClass}
                    "
                >

                    <small
                        style="
                            display:block;
                            color:#888;
                            font-size:11px;
                        "
                    >
                        販売可能
                    </small>


                    <strong>
                        ${sellable}
                    </strong>

                </div>


                <button
                    type="button"
                    class="inventory-adjust-button"
                    data-product-id="
                        ${product.id}
                    "
                    style="
                        padding:9px 12px;
                        border:1px solid #ddd;
                        border-radius:8px;
                        background:#fff;
                        cursor:pointer;
                        white-space:nowrap;
                    "
                >
                    在庫修正
                </button>

            `;


            row.querySelector(
                ".inventory-adjust-button"
            ).addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    openInventoryAdjustModal(
                        product.id
                    );

                }
            );


            container.appendChild(
                row
            );

        }
    );


    await loadInventoryHistory();

}


// ============================================================
// 在庫履歴取得
// ============================================================

function getAllInventoryHistory() {

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    "inventoryHistory",
                    "readonly"
                );


            const request =
                transaction
                    .objectStore(
                        "inventoryHistory"
                    )
                    .getAll();


            request.onsuccess =
                () => {

                    resolve(
                        request.result || []
                    );

                };


            request.onerror =
                () => {

                    reject(
                        request.error
                    );

                };

        }
    );

}


// ============================================================
// 在庫履歴表示
// ============================================================

async function loadInventoryHistory() {

    const inventorySection =
        document.getElementById(
            "inventory-section"
        );


    if (!inventorySection) {
        return;
    }


    let historyContainer =
        document.getElementById(
            "inventory-history-list"
        );


    if (!historyContainer) {

        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.id =
            "inventory-history-wrapper";


        wrapper.style.cssText = `
            margin-top:30px;
            background:white;
            border-radius:12px;
            padding:18px;
        `;


        wrapper.innerHTML = `

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:10px;
                    margin-bottom:15px;
                "
            >

                <div>

                    <h3
                        style="
                            margin:0;
                        "
                    >
                        在庫履歴
                    </h3>


                    <p
                        style="
                            margin:5px 0 0;
                            color:#888;
                            font-size:13px;
                        "
                    >
                        在庫が増減した記録
                    </p>

                </div>

            </div>


            <div
                id="inventory-history-list"
            ></div>

        `;


        inventorySection.appendChild(
            wrapper
        );


        historyContainer =
            document.getElementById(
                "inventory-history-list"
            );

    }


    const histories =
        await getAllInventoryHistory();


    histories.sort(
        (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
    );


    historyContainer.innerHTML =
        "";


    if (
        histories.length === 0
    ) {

        historyContainer.innerHTML = `
            <div
                style="
                    padding:25px;
                    text-align:center;
                    color:#999;
                "
            >
                在庫履歴はありません
            </div>
        `;


        return;

    }


    histories.forEach(
        history => {

            const item =
                document.createElement(
                    "div"
                );


            item.style.cssText = `
                padding:13px 5px;
                border-bottom:1px solid #eee;
            `;


            let typeText =
                "在庫修正";


            if (
                history.type ===
                "sale"
            ) {

                typeText =
                    "販売";

            } else if (
                history.type ===
                "initial"
            ) {

                typeText =
                    "商品登録";

            } else if (
                history.type ===
                "product_edit"
            ) {

                typeText =
                    "商品編集";

            }


            const delta =
                Number(
                    history.delta || 0
                );


            const deltaText =
                delta > 0
                    ? `＋${delta}`
                    : `${delta}`;


            const deltaStyle =
                delta > 0
                    ? "color:#2e7d32;"
                    : "color:#c62828;";


            item.innerHTML = `

                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        gap:10px;
                        align-items:flex-start;
                    "
                >

                    <div
                        style="
                            min-width:0;
                        "
                    >

                        <div
                            style="
                                font-weight:bold;
                                overflow:hidden;
                                text-overflow:ellipsis;
                                white-space:nowrap;
                            "
                        >
                            ${escapeHTML(
                                history.productName
                            )}
                        </div>


                        <div
                            style="
                                margin-top:4px;
                                font-size:12px;
                                color:#888;
                            "
                        >
                            ${formatDateTime(
                                history.createdAt
                            )}

                            ・

                            ${escapeHTML(
                                typeText
                            )}

                            ${
                                history.reason
                                    ? `・${escapeHTML(
                                        history.reason
                                    )}`
                                    : ""
                            }

                        </div>

                    </div>


                    <div
                        style="
                            text-align:right;
                            flex-shrink:0;
                        "
                    >

                        <strong
                            style="
                                ${deltaStyle}
                                font-size:18px;
                            "
                        >
                            ${deltaText}個
                        </strong>


                        <div
                            style="
                                font-size:12px;
                                color:#888;
                                margin-top:3px;
                            "
                        >
                            ${Number(
                                history.beforeStock || 0
                            )}
                            →
                            ${Number(
                                history.afterStock || 0
                            )}

                        </div>

                    </div>

                </div>


                ${
                    history.memo

                        ? `
                            <div
                                style="
                                    margin-top:8px;
                                    padding:8px 10px;
                                    background:#f7f7f7;
                                    border-radius:7px;
                                    font-size:13px;
                                "
                            >
                                ${escapeHTML(
                                    history.memo
                                )}
                            </div>
                        `

                        : ""
                }

            `;


            historyContainer.appendChild(
                item
            );

        }
    );

}


// ============================================================
// 売上履歴
// ============================================================

function getAllSales() {

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    "sales",
                    "readonly"
                );


            const request =
                transaction
                    .objectStore(
                        "sales"
                    )
                    .getAll();


            request.onsuccess =
                () => {

                    resolve(
                        request.result || []
                    );

                };


            request.onerror =
                () => {

                    reject(
                        request.error
                    );

                };

        }
    );

}


// ============================================================
// 売上履歴表示
// ============================================================

async function loadHistory() {

    const container =
        document.getElementById(
            "history-list"
        );


    if (!container) {
        return;
    }


    const sales =
        await getAllSales();


    sales.sort(
        (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
    );


    container.innerHTML = "";


    if (
        sales.length === 0
    ) {

        container.innerHTML = `
            <div style="
                text-align:center;
                color:#999;
                padding:30px;
            ">
                売上履歴はありません
            </div>
        `;


        return;

    }


    const totalSales =
        sales.reduce(
            (sum, sale) =>
                sum +
                Number(
                    sale.total || 0
                ),

            0
        );


    const summary =
        document.createElement(
            "div"
        );


    summary.style.cssText = `
        padding:15px;
        margin-bottom:15px;
        border-radius:12px;
        background:#fff7ef;
        font-size:18px;
        font-weight:bold;
    `;


    summary.textContent =
        `売上合計 ${formatYen(totalSales)}`;


    container.appendChild(
        summary
    );


    sales.forEach(
        sale => {

            const card =
                document.createElement(
                    "div"
                );


            card.style.cssText = `
                padding:15px;
                border-bottom:1px solid #eee;
            `;


            const date =
                new Date(
                    sale.createdAt
                );


            const itemsText =
                sale.items
                    .map(
                        item =>
                            `${item.name} × ${item.quantity}`
                    )
                    .join(" / ");


            card.innerHTML = `

                <div
                    style="
                        font-size:12px;
                        color:#888;
                        margin-bottom:5px;
                    "
                >
                    ${date.toLocaleString(
                        "ja-JP"
                    )}
                </div>


                <div
                    style="
                        font-weight:bold;
                    "
                >
                    ${escapeHTML(
                        itemsText
                    )}
                </div>


                <div
                    style="
                        margin-top:8px;
                        font-size:18px;
                        font-weight:bold;
                    "
                >
                    ${formatYen(
                        sale.total
                    )}
                </div>

            `;


            container.appendChild(
                card
            );

        }
    );

}


// ============================================================
// 画面切り替え
// ============================================================

function showSection(
    sectionId
) {

    document
        .querySelectorAll(
            ".app-section"
        )
        .forEach(
            section => {

                section.style.display =
                    "none";

            }
        );


    const target =
        document.getElementById(
            sectionId
        );


    if (!target) {
        return;
    }


    target.style.display =
        "block";


    if (
        sectionId ===
        "products-section"
    ) {

        loadProducts();

    }


    if (
        sectionId ===
        "reservation-section"
    ) {

        loadReservations();

    }


    if (
        sectionId ===
        "register-section"
    ) {

        loadRegisterProducts();

        renderRegisterCart();

    }


    if (
        sectionId ===
        "inventory-section"
    ) {

        loadInventory();

    }


    if (
        sectionId ===
        "history-section"
    ) {

        loadHistory();

    }


    if (sectionId === "events-section") {

    loadEvents();

}

}


// ============================================================
// 予約モーダル
// ============================================================

function openReservationModal() {

    reservationCart =
        [];


    document.getElementById(
        "reservation-name"
    ).value =
        "";


    renderReservationCart();

    loadReservationProducts();


    document
        .getElementById(
            "reservation-modal"
        )
        .classList.add(
            "show"
        );

}


// ============================================================
// 予約モーダルを閉じる
// ============================================================

function closeReservationModal() {

    document
        .getElementById(
            "reservation-modal"
        )
        .classList.remove(
            "show"
        );


    reservationCart =
        [];

}


// ============================================================
// イベント設定
// ============================================================

function setupEventListeners() {


    // --------------------------------------------------------
    // メニュー
    // --------------------------------------------------------
// イベント管理
document.getElementById("menu-events")
    ?.addEventListener(
        "click",
        () => {

            showSection(
                "events-section"
            );

        }
    );


// イベント追加
document.getElementById("add-event-button")
    ?.addEventListener(
        "click",
        openEventModal
    );


// イベント保存
document.getElementById("save-event")
    ?.addEventListener(
        "click",
        saveEvent
    );


// イベントキャンセル
document.getElementById("cancel-event")
    ?.addEventListener(
        "click",
        closeEventModal
    );


// イベントモーダル閉じる
document.getElementById("close-event-modal")
    ?.addEventListener(
        "click",
        closeEventModal
    );
    document
        .getElementById(
            "menu-products"
        )
        ?.addEventListener(
            "click",
            () => {

                showSection(
                    "products-section"
                );

            }
        );


    document
        .getElementById(
            "menu-reservation"
        )
        ?.addEventListener(
            "click",
            () => {

                showSection(
                    "reservation-section"
                );

            }
        );


    document
        .getElementById(
            "menu-register"
        )
        ?.addEventListener(
            "click",
            () => {

                showSection(
                    "register-section"
                );

            }
        );


    document
        .getElementById(
            "menu-inventory"
        )
        ?.addEventListener(
            "click",
            () => {

                showSection(
                    "inventory-section"
                );

            }
        );


    document
        .getElementById(
            "menu-history"
        )
        ?.addEventListener(
            "click",
            () => {

                showSection(
                    "history-section"
                );

            }
        );


    // --------------------------------------------------------
    // 商品追加
    // --------------------------------------------------------

    document
        .getElementById(
            "add-product-button"
        )
        ?.addEventListener(
            "click",
            () => {

                openProductModal();

            }
        );


    // --------------------------------------------------------
    // 商品保存
    // --------------------------------------------------------

    document
        .getElementById(
            "save-product"
        )
        ?.addEventListener(
            "click",
            saveProduct
        );


    // --------------------------------------------------------
    // 商品削除
    // --------------------------------------------------------

    document
        .getElementById(
            "delete-product"
        )
        ?.addEventListener(
            "click",
            deleteProduct
        );


    // --------------------------------------------------------
    // 商品キャンセル
    // --------------------------------------------------------

    document
        .getElementById(
            "cancel-product"
        )
        ?.addEventListener(
            "click",
            closeProductModal
        );


    document
        .getElementById(
            "close-product-modal"
        )
        ?.addEventListener(
            "click",
            closeProductModal
        );


    // --------------------------------------------------------
    // 商品画像
    // --------------------------------------------------------

    document
        .getElementById(
            "product-image"
        )
        ?.addEventListener(
            "change",
            async event => {

                const file =
                    event.target.files?.[0];


                if (!file) {
                    return;
                }


                const image =
                    await fileToDataURL(
                        file
                    );


                document.getElementById(
                    "image-preview"
                ).innerHTML = `
                    <img src="${image}">
                `;

            }
        );


    // --------------------------------------------------------
    // 大カテゴリ
    // --------------------------------------------------------

    document
        .getElementById(
            "product-parent-category"
        )
        ?.addEventListener(
            "change",
            event => {

                populateSubCategories(
                    event.target.value
                );

            }
        );


    // --------------------------------------------------------
    // 予約追加
    // --------------------------------------------------------

    document
        .getElementById(
            "add-reservation-button"
        )
        ?.addEventListener(
            "click",
            openReservationModal
        );


    // --------------------------------------------------------
    // 予約キャンセル
    // --------------------------------------------------------

    document
        .getElementById(
            "cancel-reservation"
        )
        ?.addEventListener(
            "click",
            closeReservationModal
        );


    document
        .getElementById(
            "close-reservation-modal"
        )
        ?.addEventListener(
            "click",
            closeReservationModal
        );


    // --------------------------------------------------------
    // 予約保存
    // --------------------------------------------------------

    document
        .getElementById(
            "save-reservation"
        )
        ?.addEventListener(
            "click",
            saveReservation
        );


    // --------------------------------------------------------
    // 預かり金
    // --------------------------------------------------------

    document
        .getElementById(
            "cash-received"
        )
        ?.addEventListener(
            "input",
            updateRegisterChange
        );


    // --------------------------------------------------------
    // 販売確定
    // --------------------------------------------------------

    document
        .getElementById(
            "complete-sale"
        )
        ?.addEventListener(
            "click",
            completeSale
        );

}


// ============================================================
// イベント管理
// ============================================================

async function getAllEvents() {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                ["events"],
                "readonly"
            );

        const store =
            transaction.objectStore("events");

        const request =
            store.getAll();

        request.onsuccess = () => {

            resolve(
                request.result || []
            );

        };

        request.onerror = () => {

            reject(
                request.error
            );

        };

    });

}



// ============================================================
// イベント一覧表示
// ============================================================

async function loadEvents() {

    const eventList =
        document.getElementById("event-list");

    if (!eventList) {
        return;
    }


    try {

        const events =
            await getAllEvents();


        events.sort((a, b) => {

            return (b.date || "")
                .localeCompare(
                    a.date || ""
                );

        });


        if (events.length === 0) {

            eventList.innerHTML = `
                <div style="
                    padding:30px;
                    text-align:center;
                    color:#999;
                ">
                    イベントはありません
                </div>
            `;

            return;
        }


        eventList.innerHTML =
            events.map(event => {

                return `
                    <div
                        class="event-card"
                        data-event-id="${escapeHTML(event.id)}"
                        style="
                            padding:16px;
                            margin-bottom:12px;
                            border:1px solid #ddd;
                            border-radius:12px;
                            cursor:pointer;
                        "
                    >

<div style="
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
    margin-bottom:8px;
">

    <h3 style="
        margin:0;
    ">
        ${escapeHTML(event.name)}
    </h3>

    <button
        type="button"
        class="secondary-button event-delete-button"
        data-event-id="${escapeHTML(event.id)}"
    >
        削除
    </button>

</div>


                        <div>
                            開催日：
                            ${escapeHTML(
                                event.date || "未設定"
                            )}
                        </div>


                        ${
                            event.memo
                                ? `
                                    <div style="
                                        margin-top:8px;
                                        color:#666;
                                        white-space:pre-wrap;
                                    ">
                                        ${escapeHTML(
                                            event.memo
                                        )}
                                    </div>
                                  `
                                : ""
                        }

                    </div>
                `;

            }).join("");


// ----------------------------------------------------
// イベントカードクリック
// ----------------------------------------------------

eventList
    .querySelectorAll(".event-card")
    .forEach(card => {

        card.addEventListener(
            "click",
            event => {

                // 削除ボタンを押した場合は
                // イベント詳細を開かない
                if (
                    event.target.closest(
                        ".event-delete-button"
                    )
                ) {
                    return;
                }

                const eventId =
                    card.dataset.eventId;

                openEventDetail(
                    eventId
                );

            }
        );

    });


// ----------------------------------------------------
// イベント削除ボタン
// ----------------------------------------------------

eventList
    .querySelectorAll(
        ".event-delete-button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    const eventId =
                        button.dataset.eventId;

                    deleteEvent(
                        eventId
                    );

                }
            );

        }
    );


    } catch (error) {

        console.error(
            "イベント読み込みエラー",
            error
        );


        eventList.innerHTML = `
            <div style="
                padding:30px;
                text-align:center;
                color:#c62828;
            ">
                イベントの読み込みに失敗しました
            </div>
        `;

    }

}
// ============================================================
// イベント詳細
// ============================================================

async function openEventDetail(eventId) {

    const eventDetail =
        document.getElementById(
            "event-detail"
        );

    const eventList =
        document.getElementById(
            "event-list"
        );


    if (!eventDetail) {
        return;
    }


    try {

        const event =
            await new Promise(
                (resolve, reject) => {

                    const transaction =
                        db.transaction(
                            ["events"],
                            "readonly"
                        );

                    const store =
                        transaction.objectStore(
                            "events"
                        );

                    const request =
                        store.get(eventId);


                    request.onsuccess = () => {

                        resolve(
                            request.result
                        );

                    };


                    request.onerror = () => {

                        reject(
                            request.error
                        );

                    };

                }
            );


        if (!event) {

            alert(
                "イベントが見つかりません。"
            );

            return;
        }


        // ----------------------------------------------------
        // 一覧を隠す
        // ----------------------------------------------------

        if (eventList) {

            eventList.style.display =
                "none";

        }


        // ----------------------------------------------------
        // 詳細を表示
        // ----------------------------------------------------

        eventDetail.style.display =
            "block";


        // ----------------------------------------------------
        // 詳細画面
        // ----------------------------------------------------

        eventDetail.innerHTML = `

            <div
                style="
                    margin-bottom:20px;
                "
            >

                <button
                    id="back-to-event-list"
                    type="button"
                    class="secondary-button"
                >
                    ← イベント一覧に戻る
                </button>

            </div>


            <div
                style="
                    padding:20px;
                    border:1px solid #ddd;
                    border-radius:12px;
                "
            >

                <h2 style="
                    margin-top:0;
                ">
                    ${escapeHTML(event.name)}
                </h2>


                <div style="
                    margin-bottom:10px;
                ">
                    開催日：
                    ${escapeHTML(
                        event.date || "未設定"
                    )}
                </div>


                ${
                    event.memo
                        ? `
                            <div style="
                                color:#666;
                                white-space:pre-wrap;
                            ">
                                ${escapeHTML(
                                    event.memo
                                )}
                            </div>
                          `
                        : ""
                }


                <hr
                    style="
                        margin:20px 0;
                        border:0;
                        border-top:1px solid #ddd;
                    "
                >


                <h3>
                    イベント開始在庫・販売状況
                </h3>


                <div id="event-start-inventory">

                    <p style="
                        color:#999;
                    ">
                        読み込み中...
                    </p>

                </div>


                <hr
                    style="
                        margin:20px 0;
                        border:0;
                        border-top:1px solid #ddd;
                    "
                >


                <h3>
                    イベント売上
                </h3>


                <div id="event-sales-summary">

                    <p style="
                        color:#999;
                    ">
                        読み込み中...
                    </p>

                </div>


                <hr
                    style="
                        margin:20px 0;
                        border:0;
                        border-top:1px solid #ddd;
                    "
                >


                <h3>
                    材料費
                </h3>


                <div id="event-material-cost">

                    <div
                        style="
                            display:flex;
                            align-items:center;
                            gap:8px;
                            flex-wrap:wrap;
                            margin-bottom:12px;
                        "
                    >

                        <label>
                            材料費
                        </label>


                        <input
                            id="event-material-cost-input"
                            type="number"
                            min="0"
                            step="1"
                            value="0"
                            style="
                                width:140px;
                                padding:8px;
                                box-sizing:border-box;
                            "
                        >


                        <span>
                            円
                        </span>

                    </div>


                    <div
                        style="
                            margin-bottom:12px;
                        "
                    >

                        <label>
                            メモ
                        </label>


                        <textarea
                            id="event-material-cost-memo"
                            rows="3"
                            style="
                                display:block;
                                width:100%;
                                max-width:500px;
                                padding:8px;
                                box-sizing:border-box;
                                margin-top:5px;
                            "
                            placeholder="材料費についてのメモ"
                        ></textarea>

                    </div>


                    <button
                        id="save-event-material-cost"
                        class="primary-button"
                        type="button"
                    >
                        材料費を保存
                    </button>

                </div>


                <hr
                    style="
                        margin:20px 0;
                        border:0;
                        border-top:1px solid #ddd;
                    "
                >


                <h3>
                    イベント経費
                </h3>


                <div id="event-expenses">

                    <!-- ================================================ -->
                    <!-- 経費入力 -->
                    <!-- ================================================ -->

                    <div
                        style="
                            padding:15px;
                            border:1px solid #eee;
                            border-radius:8px;
                            margin-bottom:15px;
                        "
                    >

                        <div
                            style="
                                margin-bottom:10px;
                            "
                        >

                            <label>
                                経費種類
                            </label>


                            <select
                                id="event-expense-type"
                                style="
                                    display:block;
                                    width:100%;
                                    max-width:300px;
                                    padding:8px;
                                    margin-top:5px;
                                    box-sizing:border-box;
                                "
                            >

                                <option value="参加費">
                                    参加費
                                </option>

                                <option value="交通費">
                                    交通費
                                </option>

                                <option value="宿泊費">
                                    宿泊費
                                </option>

                                <option value="搬入・送料">
                                    搬入・送料
                                </option>

                                <option value="駐車場">
                                    駐車場
                                </option>

                                <option value="印刷費">
                                    印刷費
                                </option>

                                <option value="消耗品">
                                    消耗品
                                </option>

                                <option value="手数料">
                                    手数料
                                </option>

                                <option value="その他">
                                    その他
                                </option>

                            </select>

                        </div>


                        <div
                            style="
                                margin-bottom:10px;
                            "
                        >

                            <label>
                                金額
                            </label>


                            <div
                                style="
                                    display:flex;
                                    align-items:center;
                                    gap:8px;
                                    margin-top:5px;
                                "
                            >

                                <input
                                    id="event-expense-amount"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value=""
                                    style="
                                        width:140px;
                                        padding:8px;
                                        box-sizing:border-box;
                                    "
                                >


                                <span>
                                    円
                                </span>

                            </div>

                        </div>


                        <div
                            style="
                                margin-bottom:10px;
                            "
                        >

                            <label>
                                日付
                            </label>


                            <input
                                id="event-expense-date"
                                type="date"
                                style="
                                    display:block;
                                    width:180px;
                                    padding:8px;
                                    margin-top:5px;
                                    box-sizing:border-box;
                                "
                            >

                        </div>


                        <div
                            style="
                                margin-bottom:12px;
                            "
                        >

                            <label>
                                メモ
                            </label>


                            <textarea
                                id="event-expense-memo"
                                rows="3"
                                style="
                                    display:block;
                                    width:100%;
                                    max-width:500px;
                                    padding:8px;
                                    box-sizing:border-box;
                                    margin-top:5px;
                                "
                                placeholder="必要ならメモを入力"
                            ></textarea>

                        </div>


                        <button
                            id="add-event-expense"
                            class="primary-button"
                            type="button"
                        >
                            経費を追加
                        </button>

                    </div>


                    <!-- ================================================ -->
                    <!-- 経費一覧 -->
                    <!-- ================================================ -->

                    <div id="event-expense-list">

                        <p style="
                            color:#999;
                        ">
                            読み込み中...
                        </p>

                    </div>


                    <!-- ================================================ -->
                    <!-- 経費合計 -->
                    <!-- ================================================ -->

                    <div
                        id="event-expense-total"
                        style="
                            margin-top:15px;
                            padding:15px;
                            background:#f7f7f7;
                            border-radius:8px;
                            font-size:18px;
                            display:flex;
                            justify-content:space-between;
                        "
                    >

                        <span>
                            経費合計
                        </span>


                        <strong>
                            ¥0
                        </strong>

                    </div>

                </div>


                <hr
                    style="
                        margin:20px 0;
                        border:0;
                        border-top:1px solid #ddd;
                    "
                >


                <h3>
                    イベント収支
                </h3>


                <div
                    id="event-profit-summary"
                    style="
                        padding:15px;
                        background:#f7f7f7;
                        border-radius:8px;
                    "
                >

                    <p style="
                        color:#999;
                    ">
                        読み込み中...
                    </p>

                </div>


                <hr
                    style="
                        margin:20px 0;
                        border:0;
                        border-top:1px solid #ddd;
                    "
                >


                <div
                    id="event-finalize-area"
                    style="
                        padding:15px;
                        border:1px solid #ddd;
                        border-radius:8px;
                        background:#fafafa;
                    "
                >

                    <h3 style="
                        margin-top:0;
                    ">
                        イベント終了
                    </h3>


                    <p
                        id="event-finalize-description"
                        style="
                            color:#666;
                            line-height:1.6;
                        "
                    >
                        イベント終了時に、各商品の残り在庫を
                        マスター在庫へ戻します。
                    </p>


                    <button
                        id="finalize-event-button"
                        class="primary-button"
                        type="button"
                    >
                        イベントを終了する
                    </button>

                </div>

            </div>

        `;


               // ----------------------------------------------------
        // ボタンの動作を先に設定
        // ----------------------------------------------------
        // データ読み込み途中でエラーが起きても、
        // ボタンまで使えなくならないようにする
        // ----------------------------------------------------


        // ----------------------------------------------------
        // イベント一覧に戻る
        // ----------------------------------------------------

        const backButton =
            document.getElementById(
                "back-to-event-list"
            );

        if (backButton) {

            backButton.onclick = () => {

                eventDetail.style.display =
                    "none";

                if (eventList) {

                    eventList.style.display =
                        "block";

                }

            };

        }


        // ----------------------------------------------------
        // 材料費を保存
        // ----------------------------------------------------

        const saveMaterialCostButton =
            document.getElementById(
                "save-event-material-cost"
            );

        if (saveMaterialCostButton) {

            saveMaterialCostButton.onclick =
                () => {

                    saveEventMaterialCost(
                        eventId
                    );

                };

        }


        // ----------------------------------------------------
        // 経費を追加
        // ----------------------------------------------------

        const addExpenseButton =
            document.getElementById(
                "add-event-expense"
            );

        if (addExpenseButton) {

            addExpenseButton.onclick =
                () => {

                    addEventExpense(
                        eventId
                    );

                };

        }


        // ----------------------------------------------------
        // イベント終了
        // ----------------------------------------------------

        const finalizeEventButton =
            document.getElementById(
                "finalize-event-button"
            );

        if (finalizeEventButton) {

            finalizeEventButton.onclick =
                () => {

                    finalizeEvent(
                        eventId
                    );

                };

        }


        // ----------------------------------------------------
        // 各項目を読み込む
        // ----------------------------------------------------
        // どれか1つの読み込みに失敗しても、
        // 他の部分まで巻き込まないようにする
        // ----------------------------------------------------


        try {

            await loadEventStartInventory(
                eventId
            );

        } catch (error) {

            console.error(
                "イベント開始在庫の読み込みエラー",
                error
            );

        }


        try {

            await loadEventSalesSummary(
                eventId
            );

        } catch (error) {

            console.error(
                "イベント売上の読み込みエラー",
                error
            );

        }


        try {

            await loadEventMaterialCost(
                eventId
            );

        } catch (error) {

            console.error(
                "材料費の読み込みエラー",
                error
            );

        }


        try {

            await loadEventExpenses(
                eventId
            );

        } catch (error) {

            console.error(
                "イベント経費の読み込みエラー",
                error
            );

        }


        try {

            await loadEventProfitSummary(
                eventId
            );

        } catch (error) {

            console.error(
                "イベント収支の読み込みエラー",
                error
            );

        }


        // ----------------------------------------------------
        // 終了済みイベントの表示
        // ----------------------------------------------------

        if (
            event.status ===
            "completed"
        ) {

            if (finalizeEventButton) {

                finalizeEventButton.disabled =
                    true;

                finalizeEventButton.textContent =
                    "イベント終了済み";

                finalizeEventButton.style.opacity =
                    "0.6";

                finalizeEventButton.style.cursor =
                    "default";

            }


            const description =
                document.getElementById(
                    "event-finalize-description"
                );


            if (description) {

                const finalizedText =
                    event.finalizedAt
                        ? formatDateTime(
                            event.finalizedAt
                        )
                        : "日時不明";


                description.textContent =
                    "このイベントは終了済みです。" +
                    "（終了日時：" +
                    finalizedText +
                    "）";

            }

        }

        // ----------------------------------------------------
        // 終了済みイベントの表示
        // ----------------------------------------------------

        if (
            event.status ===
            "completed"
        ) {

            if (finalizeEventButton) {

                finalizeEventButton.disabled =
                    true;

                finalizeEventButton.textContent =
                    "イベント終了済み";

                finalizeEventButton.style.opacity =
                    "0.6";

                finalizeEventButton.style.cursor =
                    "default";

            }


            const description =
                document.getElementById(
                    "event-finalize-description"
                );


            if (description) {

                const finalizedText =
                    event.finalizedAt
                        ? formatDateTime(
                            event.finalizedAt
                        )
                        : "日時不明";


                description.textContent =
                    "このイベントは終了済みです。" +
                    "（終了日時：" +
                    finalizedText +
                    "）";

            }

        }


        // ----------------------------------------------------
        // イベント一覧に戻る
        // ----------------------------------------------------

        document
            .getElementById(
                "back-to-event-list"
            )
            ?.addEventListener(
                "click",
                () => {

                    eventDetail.style.display =
                        "none";


                    if (eventList) {

                        eventList.style.display =
                            "block";

                    }

                }
            );


    } catch (error) {

        console.error(
            "イベント詳細読み込みエラー",
            error
        );


        alert(
            "イベント詳細の読み込みに失敗しました。\n\n" +
            "エラー：" +
            (error?.message || error)
        );

    }

}

// ============================================================
// イベント終了
// ============================================================

async function finalizeEvent(eventId) {

    if (!eventId) {

        alert(
            "イベントIDが取得できません。"
        );

        return;
    }


    try {

        // ----------------------------------------------------
        // イベント取得
        // ----------------------------------------------------

        const event =
            await getEventById(
                eventId
            );


        if (!event) {

            alert(
                "イベントが見つかりません。"
            );

            return;
        }


        // ----------------------------------------------------
        // すでに終了済みか確認
        // ----------------------------------------------------

        if (
            event.status ===
            "completed"
        ) {

            alert(
                "このイベントはすでに終了しています。"
            );

            return;
        }


        // ----------------------------------------------------
        // 最終確認
        // ----------------------------------------------------

        const confirmed =
            confirm(
                "イベントを終了します。\n\n" +
                "各商品の残り在庫をマスター在庫へ戻します。\n\n" +
                "この処理は取り消しできません。\n\n" +
                "本当に終了しますか？"
            );


        if (!confirmed) {

            return;

        }


        // ----------------------------------------------------
        // 商品一覧を取得
        // ----------------------------------------------------

        const products =
            await getAllProducts();


        const productMap =
            new Map();


        products.forEach(
            product => {

                productMap.set(
                    String(
                        product.id
                    ),
                    product
                );

            }
        );


        // ----------------------------------------------------
        // イベント在庫を取得
        // ----------------------------------------------------

        const eventInventory =
            await new Promise(
                (resolve, reject) => {

                    const transaction =
                        db.transaction(
                            ["eventInventory"],
                            "readonly"
                        );


                    const store =
                        transaction.objectStore(
                            "eventInventory"
                        );


                    const request =
                        store.getAll();


                    request.onsuccess =
                        () => {

                            const allData =
                                request.result || [];


                            const matchedData =
                                allData.filter(
                                    item =>
                                        String(
                                            item.eventId
                                        ) ===
                                        String(
                                            eventId
                                        )
                                );


                            resolve(
                                matchedData
                            );

                        };


                    request.onerror =
                        () => {

                            reject(
                                request.error
                            );

                        };

                }
            );


        // ----------------------------------------------------
        // マスター在庫へ戻す数量を計算
        // ----------------------------------------------------

        const returnData = [];


        eventInventory.forEach(
            inventory => {

                const product =
                    productMap.get(
                        String(
                            inventory.productId
                        )
                    );


                if (!product) {

                    return;

                }


                const startQuantity =
                    Math.max(
                        0,
                        Number(
                            inventory.quantity || 0
                        )
                    );


                const soldQuantity =
                    Math.max(
                        0,
                        Number(
                            inventory.soldQuantity || 0
                        )
                    );


                const remainingQuantity =
                    Math.max(
                        0,
                        startQuantity -
                        soldQuantity
                    );


                returnData.push({

                    productId:
                        product.id,

                    remainingQuantity:
                        remainingQuantity

                });

            }
        );


        // ----------------------------------------------------
        // マスター在庫更新
        // ＋ イベント終了状態を保存
        // ----------------------------------------------------

        await new Promise(
            (resolve, reject) => {

                const transaction =
                    db.transaction(
                        [
                            "products",
                            "events"
                        ],
                        "readwrite"
                    );


                const productStore =
                    transaction.objectStore(
                        "products"
                    );


                const eventStore =
                    transaction.objectStore(
                        "events"
                    );


                // ------------------------------------------------
                // 商品のマスター在庫に残りを戻す
                // ------------------------------------------------

                returnData.forEach(
                    data => {

                        const product =
                            productMap.get(
                                String(
                                    data.productId
                                )
                            );


                        if (!product) {

                            return;

                        }


                        const currentStock =
                            Math.max(
                                0,
                                Number(
                                    product.stock || 0
                                )
                            );


                        product.stock =
                            currentStock +
                            data.remainingQuantity;


                        product.updatedAt =
                            new Date().toISOString();


                        productStore.put(
                            product
                        );

                    }
                );


                // ------------------------------------------------
                // イベントを終了済みにする
                // ------------------------------------------------

                event.status =
                    "completed";


                event.finalizedAt =
                    new Date().toISOString();


                eventStore.put(
                    event
                );


                // ------------------------------------------------
                // トランザクション完了
                // ------------------------------------------------

                transaction.oncomplete =
                    () => {

                        resolve();

                    };


                transaction.onerror =
                    () => {

                        reject(
                            transaction.error ||
                            new Error(
                                "イベント終了処理に失敗しました。"
                            )
                        );

                    };


                transaction.onabort =
                    () => {

                        reject(
                            transaction.error ||
                            new Error(
                                "イベント終了処理が中断されました。"
                            )
                        );

                    };

            }
        );


        // ----------------------------------------------------
        // マスター在庫画面を更新
        // ----------------------------------------------------

        await loadProducts();


        // ----------------------------------------------------
        // 完了メッセージ
        // ----------------------------------------------------

        alert(
            "イベントを終了しました。\n\n" +
            "残り在庫をマスター在庫へ戻しました。"
        );


        // ----------------------------------------------------
        // イベント詳細を再表示
        // ----------------------------------------------------

        await openEventDetail(
            eventId
        );


    } catch (error) {

        console.error(
            "イベント終了エラー",
            error
        );


        alert(
            "イベント終了処理に失敗しました。\n\n" +
            "エラー：" +
            (
                error?.message ||
                error
            )
        );

    }

}
// ============================================================
// イベント経費一覧表示
// ============================================================

async function loadEventExpenses(eventId) {

    const list =
        document.getElementById(
            "event-expense-list"
        );


    const totalElement =
        document.getElementById(
            "event-expense-total"
        );


    const addButton =
        document.getElementById(
            "add-event-expense"
        );


    const typeInput =
        document.getElementById(
            "event-expense-type"
        );


    const amountInput =
        document.getElementById(
            "event-expense-amount"
        );


    const dateInput =
        document.getElementById(
            "event-expense-date"
        );


    const memoInput =
        document.getElementById(
            "event-expense-memo"
        );


    if (
        !list ||
        !totalElement ||
        !addButton ||
        !typeInput ||
        !amountInput ||
        !dateInput ||
        !memoInput
    ) {
        return;
    }


    try {

        // ----------------------------------------------------
        // 日付の初期値
        // ----------------------------------------------------

        const event =
            await getEventById(
                eventId
            );


        if (
            event &&
            event.date
        ) {

            dateInput.value =
                event.date;

        }


        // ----------------------------------------------------
        // 経費を取得
        // ----------------------------------------------------

        const expenses =
            await new Promise(
                (resolve, reject) => {

                    const transaction =
                        db.transaction(
                            ["eventExpenses"],
                            "readonly"
                        );


                    const store =
                        transaction.objectStore(
                            "eventExpenses"
                        );


                    const request =
                        store.getAll();


                    request.onsuccess =
                        () => {

                            const allData =
                                request.result || [];


                            const matchedData =
                                allData.filter(
                                    item =>
                                        String(
                                            item.eventId
                                        ) ===
                                        String(
                                            eventId
                                        )
                                );


                            resolve(
                                matchedData
                            );

                        };


                    request.onerror =
                        () => {

                            reject(
                                request.error
                            );

                        };

                }
            );


        // ----------------------------------------------------
        // 日付順に並べる
        // ----------------------------------------------------

        expenses.sort(
            (a, b) => {

                return (
                    (a.date || "")
                        .localeCompare(
                            b.date || ""
                        )
                );

            }
        );


        // ----------------------------------------------------
        // 合計
        // ----------------------------------------------------

        let total =
            0;


        expenses.forEach(
            expense => {

                total +=
                    Number(
                        expense.amount || 0
                    );

            }
        );


        // ----------------------------------------------------
        // 経費一覧
        // ----------------------------------------------------

        if (
            expenses.length === 0
        ) {

            list.innerHTML = `

                <p style="
                    color:#999;
                ">
                    まだ経費が登録されていません。
                </p>

            `;

        } else {

            list.innerHTML =
                expenses
                    .map(
                        expense => {

                            return `

                                <div
                                    style="
                                        padding:12px 0;
                                        border-bottom:1px solid #eee;
                                    "
                                >

                                    <div
                                        style="
                                            display:flex;
                                            align-items:center;
                                            justify-content:space-between;
                                            gap:10px;
                                            flex-wrap:wrap;
                                        "
                                    >

                                        <div>

                                            <strong>
                                                ${escapeHTML(
                                                    expense.type
                                                )}
                                            </strong>

                                            ${
                                                expense.date
                                                    ? `
                                                        <span
                                                            style="
                                                                margin-left:8px;
                                                                color:#999;
                                                                font-size:13px;
                                                            "
                                                        >
                                                            ${escapeHTML(
                                                                expense.date
                                                            )}
                                                        </span>
                                                      `
                                                    : ""
                                            }

                                        </div>


                                        <div
                                            style="
                                                display:flex;
                                                align-items:center;
                                                gap:10px;
                                            "
                                        >

                                            <strong>
                                                ${formatYen(
                                                    Number(
                                                        expense.amount || 0
                                                    )
                                                )}
                                            </strong>


                                            <button
                                                type="button"
                                                class="secondary-button event-expense-delete"
                                                data-expense-id="${escapeHTML(
                                                    String(
                                                        expense.id
                                                    )
                                                )}"
                                            >
                                                削除
                                            </button>

                                        </div>

                                    </div>


                                    ${
                                        expense.memo
                                            ? `
                                                <div
                                                    style="
                                                        margin-top:6px;
                                                        color:#666;
                                                        white-space:pre-wrap;
                                                    "
                                                >
                                                    ${escapeHTML(
                                                        expense.memo
                                                    )}
                                                </div>
                                              `
                                            : ""
                                    }

                                </div>

                            `;

                        }
                    )
                    .join("");

        }


        // ----------------------------------------------------
        // 合計表示
        // ----------------------------------------------------

        totalElement.innerHTML = `

            <span>
                経費合計
            </span>

            <strong>
                ${formatYen(
                    total
                )}
            </strong>

        `;


        // ----------------------------------------------------
        // 経費追加ボタン
        // ----------------------------------------------------

        addButton.onclick =
            () => {

                addEventExpense(
                    eventId
                );

            };


        // ----------------------------------------------------
        // 削除ボタン
        // ----------------------------------------------------

        list
            .querySelectorAll(
                ".event-expense-delete"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const expenseId =
                                button.dataset.expenseId;


                            deleteEventExpense(
                                eventId,
                                expenseId
                            );

                        }
                    );

                }
            );


    } catch (error) {

        console.error(
            "イベント経費読み込みエラー",
            error
        );


        list.innerHTML = `

            <p style="
                color:#c62828;
            ">
                経費の読み込みに失敗しました。
            </p>

        `;

    }

}


// ============================================================
// イベント収支表示
// ============================================================

async function loadEventProfitSummary(eventId) {

    const container =
        document.getElementById(
            "event-profit-summary"
        );


    if (!container) {
        return;
    }


    try {

        // ----------------------------------------------------
        // 商品一覧
        // ----------------------------------------------------

        const products =
            await getAllProducts();


        const productMap =
            new Map();


        products.forEach(
            product => {

                productMap.set(
                    String(product.id),
                    product
                );

            }
        );


        // ----------------------------------------------------
        // イベント在庫 → 売上計算
        // ----------------------------------------------------

        const eventInventory =
            await new Promise(
                (resolve, reject) => {

                    const transaction =
                        db.transaction(
                            ["eventInventory"],
                            "readonly"
                        );


                    const store =
                        transaction.objectStore(
                            "eventInventory"
                        );


                    const request =
                        store.getAll();


                    request.onsuccess =
                        () => {

                            const allData =
                                request.result || [];


                            resolve(
                                allData.filter(
                                    item =>
                                        String(
                                            item.eventId
                                        ) ===
                                        String(
                                            eventId
                                        )
                                )
                            );

                        };


                    request.onerror =
                        () => {

                            reject(
                                request.error
                            );

                        };

                }
            );


        let salesTotal =
            0;


        eventInventory.forEach(
            inventory => {

                const product =
                    productMap.get(
                        String(
                            inventory.productId
                        )
                    );


                if (!product) {
                    return;
                }


                const soldQuantity =
                    Number(
                        inventory.soldQuantity || 0
                    );


                const price =
                    Number(
                        product.price || 0
                    );


                salesTotal +=
                    price *
                    soldQuantity;

            }
        );


        // ----------------------------------------------------
        // イベント本体 → 材料費
        // ----------------------------------------------------

        const event =
            await getEventById(
                eventId
            );


        const materialCost =
            Number(
                event?.materialCost || 0
            );


        // ----------------------------------------------------
        // イベント経費
        // ----------------------------------------------------

        const expenses =
            await new Promise(
                (resolve, reject) => {

                    const transaction =
                        db.transaction(
                            ["eventExpenses"],
                            "readonly"
                        );


                    const store =
                        transaction.objectStore(
                            "eventExpenses"
                        );


                    const request =
                        store.getAll();


                    request.onsuccess =
                        () => {

                            const allData =
                                request.result || [];


                            resolve(
                                allData.filter(
                                    item =>
                                        String(
                                            item.eventId
                                        ) ===
                                        String(
                                            eventId
                                        )
                                )
                            );

                        };


                    request.onerror =
                        () => {

                            reject(
                                request.error
                            );

                        };

                }
            );


        let expenseTotal =
            0;


        expenses.forEach(
            expense => {

                expenseTotal +=
                    Number(
                        expense.amount || 0
                    );

            }
        );


        // ----------------------------------------------------
        // 差引
        // ----------------------------------------------------

        const result =
            salesTotal -
            materialCost -
            expenseTotal;


        // ----------------------------------------------------
        // 表示
        // ----------------------------------------------------

        container.innerHTML = `

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    margin-bottom:10px;
                "
            >

                <span>
                    売上合計
                </span>

                <strong>
                    ${formatYen(
                        salesTotal
                    )}
                </strong>

            </div>


            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    margin-bottom:10px;
                "
            >

                <span>
                    材料費
                </span>

                <strong>
                    ${formatYen(
                        materialCost
                    )}
                </strong>

            </div>


            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    margin-bottom:10px;
                "
            >

                <span>
                    イベント経費
                </span>

                <strong>
                    ${formatYen(
                        expenseTotal
                    )}
                </strong>

            </div>


            <hr
                style="
                    margin:15px 0;
                    border:0;
                    border-top:1px solid #ddd;
                "
            >


            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    font-size:20px;
                "
            >

                <strong>
                    差引
                </strong>

                <strong>
                    ${formatYen(
                        result
                    )}
                </strong>

            </div>

        `;


    } catch (error) {

        console.error(
            "イベント収支読み込みエラー",
            error
        );


        container.innerHTML = `

            <p style="
                color:#c62828;
            ">
                イベント収支の読み込みに失敗しました。
            </p>

        `;

    }

}

// ============================================================
// イベント取得
// ============================================================

async function getEventById(eventId) {

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    ["events"],
                    "readonly"
                );


            const store =
                transaction.objectStore(
                    "events"
                );


            const request =
                store.get(eventId);


            request.onsuccess =
                () => {

                    resolve(
                        request.result
                    );

                };


            request.onerror =
                () => {

                    reject(
                        request.error
                    );

                };

        }
    );

}


// ============================================================
// イベント経費追加
// ============================================================

async function addEventExpense(eventId) {

    const typeInput =
        document.getElementById(
            "event-expense-type"
        );


    const amountInput =
        document.getElementById(
            "event-expense-amount"
        );


    const dateInput =
        document.getElementById(
            "event-expense-date"
        );


    const memoInput =
        document.getElementById(
            "event-expense-memo"
        );


    if (
        !typeInput ||
        !amountInput ||
        !dateInput ||
        !memoInput
    ) {
        return;
    }


    const type =
        typeInput.value;


    const amount =
        Number(
            amountInput.value
        );


    const date =
        dateInput.value;


    const memo =
        memoInput.value.trim();


    // --------------------------------------------------------
    // 入力チェック
    // --------------------------------------------------------

    if (!type) {

        alert(
            "経費種類を選択してください。"
        );

        return;

    }


    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        alert(
            "金額を正しく入力してください。"
        );

        return;

    }


    if (!date) {

        alert(
            "日付を入力してください。"
        );

        return;

    }


    // --------------------------------------------------------
    // 経費データ
    // --------------------------------------------------------

    const expense = {

        id:
            createId(),

        eventId:
            eventId,

        type:
            type,

        amount:
            amount,

        date:
            date,

        memo:
            memo,

        createdAt:
            new Date().toISOString()

    };


    try {

        // ----------------------------------------------------
        // 保存
        // ----------------------------------------------------

        await new Promise(
            (resolve, reject) => {

                const transaction =
                    db.transaction(
                        ["eventExpenses"],
                        "readwrite"
                    );


                const store =
                    transaction.objectStore(
                        "eventExpenses"
                    );


                store.add(
                    expense
                );


                transaction.oncomplete =
                    () => {

                        resolve();

                    };


                transaction.onerror =
                    () => {

                        reject(
                            transaction.error
                        );

                    };


                transaction.onabort =
                    () => {

                        reject(
                            transaction.error ||
                            new Error(
                                "保存が中断されました。"
                            )
                        );

                    };

            }
        );


        // ----------------------------------------------------
        // 入力欄をクリア
        // ----------------------------------------------------

        amountInput.value =
            "";


        memoInput.value =
            "";


        // ----------------------------------------------------
        // 一覧を再読み込み
        // ----------------------------------------------------

        await loadEventExpenses(
            eventId
        );


    } catch (error) {

        console.error(
            "イベント経費保存エラー",
            error
        );


        alert(
            "経費の保存に失敗しました。\n\n" +
            "エラー：" +
            (
                error?.message ||
                error
            )
        );

    }

}

// ============================================================
// イベント経費削除
// ============================================================

async function deleteEventExpense(
    eventId,
    expenseId
) {

    if (!expenseId) {
        return;
    }


    const confirmed =
        confirm(
            "この経費を削除しますか？"
        );


    if (!confirmed) {
        return;
    }


    try {

        await new Promise(
            (resolve, reject) => {

                const transaction =
                    db.transaction(
                        ["eventExpenses"],
                        "readwrite"
                    );


                const store =
                    transaction.objectStore(
                        "eventExpenses"
                    );


                store.delete(
                    expenseId
                );


                transaction.oncomplete =
                    () => {

                        resolve();

                    };


                transaction.onerror =
                    () => {

                        reject(
                            transaction.error
                        );

                    };


                transaction.onabort =
                    () => {

                        reject(
                            transaction.error ||
                            new Error(
                                "削除が中断されました。"
                            )
                        );

                    };

            }
        );


        await loadEventExpenses(
            eventId
        );


    } catch (error) {

        console.error(
            "イベント経費削除エラー",
            error
        );


        alert(
            "経費の削除に失敗しました。\n\n" +
            "エラー：" +
            (
                error?.message ||
                error
            )
        );

    }

}
 // ============================================================
// イベント材料費を表示
// ============================================================

async function loadEventMaterialCost(eventId) {

    const input =
        document.getElementById(
            "event-material-cost-input"
        );

    const memoInput =
        document.getElementById(
            "event-material-cost-memo"
        );


    const saveButton =
        document.getElementById(
            "save-event-material-cost"
        );


    if (
        !input ||
        !memoInput ||
        !saveButton
    ) {
        return;
    }


    try {

        const event =
            await new Promise(
                (resolve, reject) => {

                    const transaction =
                        db.transaction(
                            ["events"],
                            "readonly"
                        );


                    const store =
                        transaction.objectStore(
                            "events"
                        );


                    const request =
                        store.get(eventId);


                    request.onsuccess =
                        () => {

                            resolve(
                                request.result
                            );

                        };


                    request.onerror =
                        () => {

                            reject(
                                request.error
                            );

                        };

                }
            );


        if (!event) {

            return;

        }


        input.value =
            Number(
                event.materialCost || 0
            );


        memoInput.value =
            event.materialMemo || "";


        saveButton.addEventListener(
            "click",
            () => {

                saveEventMaterialCost(
                    eventId
                );

            }
        );


    } catch (error) {

        console.error(
            "イベント材料費読み込みエラー",
            error
        );

    }

}


// ============================================================
// イベント材料費を保存
// ============================================================

async function saveEventMaterialCost(eventId) {

    const input =
        document.getElementById(
            "event-material-cost-input"
        );


    const memoInput =
        document.getElementById(
            "event-material-cost-memo"
        );


    if (
        !input ||
        !memoInput
    ) {
        return;
    }


    const materialCost =
        Math.max(
            0,
            Number(
                input.value
            ) || 0
        );


    const materialMemo =
        memoInput.value.trim();


    try {

        const event =
            await new Promise(
                (resolve, reject) => {

                    const transaction =
                        db.transaction(
                            ["events"],
                            "readonly"
                        );


                    const store =
                        transaction.objectStore(
                            "events"
                        );


                    const request =
                        store.get(eventId);


                    request.onsuccess =
                        () => {

                            resolve(
                                request.result
                            );

                        };


                    request.onerror =
                        () => {

                            reject(
                                request.error
                            );

                        };

                }
            );


        if (!event) {

            alert(
                "イベントが見つかりません。"
            );

            return;

        }


        // ----------------------------------------------------
        // 材料費を更新
        // ----------------------------------------------------

        event.materialCost =
            materialCost;


        event.materialMemo =
            materialMemo;


        // ----------------------------------------------------
        // 保存
        // ----------------------------------------------------

        await new Promise(
            (resolve, reject) => {

                const transaction =
                    db.transaction(
                        ["events"],
                        "readwrite"
                    );


                const store =
                    transaction.objectStore(
                        "events"
                    );


                store.put(
                    event
                );


                transaction.oncomplete =
                    () => {

                        resolve();

                    };


                transaction.onerror =
                    () => {

                        reject(
                            transaction.error
                        );

                    };


                transaction.onabort =
                    () => {

                        reject(
                            transaction.error ||
                            new Error(
                                "保存が中断されました。"
                            )
                        );

                    };

            }
        );


        alert(
            "材料費を保存しました。"
        );


    } catch (error) {

        console.error(
            "イベント材料費保存エラー",
            error
        );


        alert(
            "材料費の保存に失敗しました。\n\n" +
            "エラー：" +
            (
                error?.message ||
                error
            )
        );

    }

}


// ============================================================
// イベント開始在庫・販売数を表示
// ============================================================

async function loadEventStartInventory(eventId) {

    const container =
        document.getElementById(
            "event-start-inventory"
        );


    if (!container) {
        return;
    }


    try {

        // ----------------------------------------------------
        // 商品一覧を取得
        // ----------------------------------------------------

        const products =
            await getAllProducts();


        if (products.length === 0) {

            container.innerHTML = `
                <p style="
                    color:#999;
                ">
                    商品が登録されていません。
                </p>
            `;

            return;
        }


        // ----------------------------------------------------
        // 保存済みイベント在庫を取得
        // ----------------------------------------------------

        const savedInventory =
            await new Promise(
                (resolve, reject) => {

                    const transaction =
                        db.transaction(
                            ["eventInventory"],
                            "readonly"
                        );


                    const store =
                        transaction.objectStore(
                            "eventInventory"
                        );


                    const request =
                        store.getAll();


                    request.onsuccess = () => {

                        const allData =
                            request.result || [];


                        const matchedData =
                            allData.filter(
                                item =>
                                    String(
                                        item.eventId
                                    ) ===
                                    String(
                                        eventId
                                    )
                            );


                        resolve(
                            matchedData
                        );

                    };


                    request.onerror = () => {

                        reject(
                            request.error
                        );

                    };

                }
            );


        // ----------------------------------------------------
        // 商品ID → イベント在庫データ
        // ----------------------------------------------------

        const inventoryMap =
            new Map();


        savedInventory.forEach(
            item => {

                inventoryMap.set(
                    String(
                        item.productId
                    ),
                    item
                );

            }
        );


        // ----------------------------------------------------
        // 商品一覧を表示
        // ----------------------------------------------------

        container.innerHTML = `

            <div
                style="
                    display:flex;
                    flex-direction:column;
                    gap:10px;
                "
            >

                ${products.map(product => {

                    const inventory =
                        inventoryMap.get(
                            String(
                                product.id
                            )
                        );


                    // 開始在庫
                    const startQuantity =
                        Number(
                            inventory?.quantity || 0
                        );


                    // 販売数
                    const soldQuantity =
                        Number(
                            inventory?.soldQuantity || 0
                        );


                    // 残り
                    const remainingQuantity =
                        Math.max(
                            0,
                            startQuantity -
                            soldQuantity
                        );


                    return `

                        <div
                            style="
                                padding:12px;
                                border:1px solid #eee;
                                border-radius:8px;
                            "
                        >

                            <div
                                style="
                                    font-weight:bold;
                                    margin-bottom:10px;
                                "
                            >
                                ${escapeHTML(
                                    product.name
                                )}
                            </div>


                            <div
                                style="
                                    color:#666;
                                    margin-bottom:10px;
                                "
                            >
                                現在のマスター在庫：
                                ${Number(
                                    product.stock || 0
                                )}
                                個
                            </div>


                            <div
                                style="
                                    display:flex;
                                    align-items:center;
                                    gap:15px;
                                    flex-wrap:wrap;
                                "
                            >

                                <!-- 開始在庫 -->

                                <label>
                                    開始在庫

                                    <input
                                        type="number"
                                        class="event-start-stock-input"
                                        data-product-id="${escapeHTML(
                                            String(
                                                product.id
                                            )
                                        )}"
                                        min="0"
                                        step="1"
                                        value="${startQuantity}"
                                        style="
                                            width:80px;
                                            padding:8px;
                                            box-sizing:border-box;
                                            margin-left:5px;
                                        "
                                    />

                                    個
                                </label>


                                <!-- 販売数 -->

                                <label>
                                    販売数

                                    <input
                                        type="number"
                                        class="event-sold-stock-input"
                                        data-product-id="${escapeHTML(
                                            String(
                                                product.id
                                            )
                                        )}"
                                        min="0"
                                        step="1"
                                        value="${soldQuantity}"
                                        style="
                                            width:80px;
                                            padding:8px;
                                            box-sizing:border-box;
                                            margin-left:5px;
                                        "
                                    />

                                    個
                                </label>


                                <!-- 残り -->

                                <div
                                    style="
                                        font-weight:bold;
                                    "
                                >
                                    残り：

                                    <span
                                        class="event-remaining-stock"
                                        data-product-id="${escapeHTML(
                                            String(
                                                product.id
                                            )
                                        )}"
                                    >
                                        ${remainingQuantity}
                                    </span>

                                    個
                                </div>

                            </div>

                        </div>

                    `;

                }).join("")}

            </div>


            <div
                style="
                    margin-top:20px;
                "
            >

                <button
                    id="save-event-start-inventory"
                    class="primary-button"
                    type="button"
                >
                    開始在庫・販売数を保存
                </button>

            </div>

        `;


        // ----------------------------------------------------
        // 残り数量をリアルタイム計算
        // ----------------------------------------------------

        const startInputs =
            document.querySelectorAll(
                ".event-start-stock-input"
            );


        const soldInputs =
            document.querySelectorAll(
                ".event-sold-stock-input"
            );


        function updateRemaining(productId) {

            const startInput =
                document.querySelector(
                    `.event-start-stock-input[data-product-id="${productId}"]`
                );


            const soldInput =
                document.querySelector(
                    `.event-sold-stock-input[data-product-id="${productId}"]`
                );


            const remainingElement =
                document.querySelector(
                    `.event-remaining-stock[data-product-id="${productId}"]`
                );


            if (
                !startInput ||
                !soldInput ||
                !remainingElement
            ) {
                return;
            }


            const startQuantity =
                Math.max(
                    0,
                    Number(
                        startInput.value
                    ) || 0
                );


            const soldQuantity =
                Math.max(
                    0,
                    Number(
                        soldInput.value
                    ) || 0
                );


            const remainingQuantity =
                Math.max(
                    0,
                    startQuantity -
                    soldQuantity
                );


            remainingElement.textContent =
                remainingQuantity;

        }


        startInputs.forEach(
            input => {

                input.addEventListener(
                    "input",
                    () => {

                        updateRemaining(
                            input.dataset.productId
                        );

                    }
                );

            }
        );


        soldInputs.forEach(
            input => {

                input.addEventListener(
                    "input",
                    () => {

                        updateRemaining(
                            input.dataset.productId
                        );

                    }
                );

            }
        );


          // ----------------------------------------------------
        // 保存ボタン
        // ----------------------------------------------------

        document
            .getElementById(
                "save-event-start-inventory"
            )
            ?.addEventListener(
                "click",
                () => {

                    saveEventStartInventory(
                        eventId
                    );

                }
            );


    } catch (error) {

        console.error(
            "イベント開始在庫読み込みエラー",
            error
        );


        container.innerHTML = `
            <p style="
                color:#c62828;
            ">
                開始在庫の読み込みに失敗しました。
            </p>
        `;

    }

}
// ============================================================
// イベント売上集計
// ============================================================

// ============================================================
// イベント売上集計
// ============================================================

async function loadEventSalesSummary(eventId) {

    const container =
        document.getElementById(
            "event-sales-summary"
        );


    if (!container) {
        return;
    }


    try {

        // ----------------------------------------------------
        // 商品一覧を取得
        // ----------------------------------------------------

        const products =
            await getAllProducts();


        // ----------------------------------------------------
        // 商品ID → 商品データ
        // ----------------------------------------------------

        const productMap =
            new Map();


        products.forEach(
            product => {

                productMap.set(
                    String(
                        product.id
                    ),
                    product
                );

            }
        );


        // ----------------------------------------------------
        // イベント在庫を取得
        // ----------------------------------------------------

        const savedInventory =
            await new Promise(
                (resolve, reject) => {

                    const transaction =
                        db.transaction(
                            ["eventInventory"],
                            "readonly"
                        );


                    const store =
                        transaction.objectStore(
                            "eventInventory"
                        );


                    const request =
                        store.getAll();


                    request.onsuccess =
                        () => {

                            const allData =
                                request.result || [];


                            const matchedData =
                                allData.filter(
                                    item =>
                                        String(
                                            item.eventId
                                        ) ===
                                        String(
                                            eventId
                                        )
                                );


                            resolve(
                                matchedData
                            );

                        };


                    request.onerror =
                        () => {

                            reject(
                                request.error
                            );

                        };

                }
            );


        // ----------------------------------------------------
        // 売上計算
        // ----------------------------------------------------

        let totalQuantity = 0;
        let totalSales = 0;


        const salesRows =
            savedInventory
                .map(
                    inventory => {

                        const product =
                            productMap.get(
                                String(
                                    inventory.productId
                                )
                            );


                        if (!product) {
                            return "";
                        }


                        const soldQuantity =
                            Number(
                                inventory.soldQuantity || 0
                            );


                        const price =
                            Number(
                                product.price || 0
                            );


                        const salesAmount =
                            price *
                            soldQuantity;


                        if (
                            soldQuantity <= 0
                        ) {
                            return "";
                        }


                        totalQuantity +=
                            soldQuantity;


                        totalSales +=
                            salesAmount;


                        return `

                            <div
                                style="
                                    display:flex;
                                    align-items:center;
                                    justify-content:space-between;
                                    gap:15px;
                                    padding:10px 0;
                                    border-bottom:1px solid #eee;
                                "
                            >

                                <div
                                    style="
                                        flex:1;
                                    "
                                >
                                    ${escapeHTML(
                                        product.name
                                    )}
                                </div>


                                <div>
                                    ${formatYen(
                                        price
                                    )}
                                    ×
                                    ${soldQuantity}個
                                </div>


                                <div
                                    style="
                                        min-width:100px;
                                        text-align:right;
                                        font-weight:bold;
                                    "
                                >
                                    ${formatYen(
                                        salesAmount
                                    )}
                                </div>

                            </div>

                        `;

                    }
                )
                .filter(
                    row => row !== ""
                )
                .join("");


        // ----------------------------------------------------
        // 売上がない場合
        // ----------------------------------------------------

        if (
            totalQuantity === 0
        ) {

            container.innerHTML = `

                <div
                    style="
                        padding:15px;
                        color:#999;
                    "
                >
                    まだ販売記録がありません。
                </div>

            `;

            return;
        }


        // ----------------------------------------------------
        // 売上表示
        // ----------------------------------------------------

        container.innerHTML = `

            <div>

                ${salesRows}

            </div>


            <div
                style="
                    margin-top:15px;
                    padding:15px;
                    background:#f7f7f7;
                    border-radius:8px;
                "
            >

                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        margin-bottom:8px;
                    "
                >
                    <span>
                        販売点数
                    </span>

                    <strong>
                        ${totalQuantity}個
                    </strong>
                </div>


                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        font-size:18px;
                    "
                >
                    <span>
                        売上合計
                    </span>

                    <strong>
                        ${formatYen(
                            totalSales
                        )}
                    </strong>
                </div>

            </div>

        `;


    } catch (error) {

        console.error(
            "イベント売上集計エラー",
            error
        );


        container.innerHTML = `
            <p style="
                color:#c62828;
            ">
                イベント売上の読み込みに失敗しました。
            </p>
        `;

    }

}


// ============================================================
// イベント開始在庫・販売数を保存
// ============================================================

// ============================================================
// イベント開始在庫・販売数を保存
// ============================================================

async function saveEventStartInventory(eventId) {

    const startInputs =
        document.querySelectorAll(
            ".event-start-stock-input"
        );


    const soldInputs =
        document.querySelectorAll(
            ".event-sold-stock-input"
        );


    if (!eventId) {

        alert(
            "イベントIDが取得できません。"
        );

        return;
    }


    if (startInputs.length === 0) {

        alert(
            "保存する商品がありません。"
        );

        return;
    }


    try {

        // ----------------------------------------------------
        // イベントを確認
        // ----------------------------------------------------

        const event =
            await getEventById(eventId);


        if (!event) {

            alert(
                "イベントが見つかりません。"
            );

            return;
        }


        if (
            event.status === "completed"
        ) {

            alert(
                "終了済みのイベントは開始在庫を変更できません。"
            );

            return;
        }


        // ----------------------------------------------------
        // 入力されたデータを作成
        // ----------------------------------------------------

        const inputData = [];


        startInputs.forEach(
            startInput => {

                const productId =
                    startInput.dataset.productId;


                if (!productId) {
                    return;
                }


                const soldInput =
                    document.querySelector(
                        `.event-sold-stock-input[data-product-id="${productId}"]`
                    );


                const startQuantity =
                    Math.max(
                        0,
                        Number(
                            startInput.value
                        ) || 0
                    );


                const soldQuantity =
                    Math.max(
                        0,
                        Number(
                            soldInput?.value
                        ) || 0
                    );


                inputData.push({

                    productId:
                        String(productId),

                    quantity:
                        startQuantity,

                    soldQuantity:
                        soldQuantity

                });

            }
        );


        if (
            inputData.length === 0
        ) {

            alert(
                "保存する商品がありません。"
            );

            return;
        }


        // ----------------------------------------------------
        // 商品数とイベント在庫を取得
        // ----------------------------------------------------

        const products =
            await getAllProducts();


        const productMap =
            new Map();


        products.forEach(
            product => {

                productMap.set(
                    String(
                        product.id
                    ),
                    product
                );

            }
        );


        const existingInventory =
            await new Promise(
                (resolve, reject) => {

                    const transaction =
                        db.transaction(
                            ["eventInventory"],
                            "readonly"
                        );


                    const store =
                        transaction.objectStore(
                            "eventInventory"
                        );


                    const request =
                        store.getAll();


                    request.onsuccess =
                        () => {

                            const allData =
                                request.result || [];


                            const matchedData =
                                allData.filter(
                                    item =>
                                        String(
                                            item.eventId
                                        ) ===
                                        String(
                                            eventId
                                        )
                                );


                            resolve(
                                matchedData
                            );

                        };


                    request.onerror =
                        () => {

                            reject(
                                request.error
                            );

                        };

                }
            );


        // ----------------------------------------------------
        // 商品ID → 既存イベント在庫
        // ----------------------------------------------------

        const existingMap =
            new Map();


        existingInventory.forEach(
            item => {

                existingMap.set(
                    String(
                        item.productId
                    ),
                    item
                );

            }
        );


        // ----------------------------------------------------
        // マスター在庫を確認
        //
        // 現在のマスター在庫は、
        // すでにイベントへ持ち出した分が
        // 引かれている状態。
        //
        // そのため、
        //
        // 現在のマスター在庫
        // ＋ 前回の開始在庫
        //
        // が今回設定できる最大値になる。
        // ----------------------------------------------------

        for (
            const data of inputData
        ) {

            const product =
                productMap.get(
                    String(
                        data.productId
                    )
                );


            if (!product) {

                alert(
                    "商品が見つかりません。\n\n" +
                    "商品ID：" +
                    data.productId
                );

                return;
            }


            const currentStock =
                Math.max(
                    0,
                    Number(
                        product.stock || 0
                    )
                );


            const oldData =
                existingMap.get(
                    String(
                        data.productId
                    )
                );


            const oldStartQuantity =
                Math.max(
                    0,
                    Number(
                        oldData?.quantity || 0
                    )
                );


            const availableForStart =
                currentStock +
                oldStartQuantity;


            if (
                data.quantity >
                availableForStart
            ) {

                alert(
                    "開始在庫を保存できません。\n\n" +
                    "商品：" +
                    product.name +
                    "\n" +
                    "現在のマスター在庫：" +
                    currentStock +
                    "個\n" +
                    "現在設定できる開始在庫：" +
                    availableForStart +
                    "個\n" +
                    "入力された開始在庫：" +
                    data.quantity +
                    "個"
                );

                return;
            }

        }


        // ----------------------------------------------------
        // 保存用データを作成
        // ----------------------------------------------------

        const saveData = [];


        inputData.forEach(
            data => {

                const oldData =
                    existingMap.get(
                        String(
                            data.productId
                        )
                    );


                saveData.push({

                    id:
                        String(eventId) +
                        "_" +
                        String(data.productId),

                    eventId:
                        eventId,

                    productId:
                        data.productId,

                    quantity:
                        data.quantity,

                    soldQuantity:
                        data.soldQuantity,

                    createdAt:
                        oldData?.createdAt ||
                        new Date().toISOString()

                });

            }
        );


        // ----------------------------------------------------
        // 商品在庫を変更
        //
        // 新規：
        //   マスター在庫 - 開始在庫
        //
        // 変更：
        //   新しい開始在庫 - 古い開始在庫
        //   の差分だけマスター在庫を変更
        // ----------------------------------------------------

        const productUpdates = [];


        inputData.forEach(
            data => {

                const product =
                    productMap.get(
                        String(
                            data.productId
                        )
                    );


                if (!product) {
                    return;
                }


                const currentStock =
                    Math.max(
                        0,
                        Number(
                            product.stock || 0
                        )
                    );


                const oldData =
                    existingMap.get(
                        String(
                            data.productId
                        )
                    );


                const oldStartQuantity =
                    Math.max(
                        0,
                        Number(
                            oldData?.quantity || 0
                        )
                    );


                const difference =
                    data.quantity -
                    oldStartQuantity;


                const newStock =
                    currentStock -
                    difference;


                productUpdates.push({

                    product:
                        product,

                    newStock:
                        Math.max(
                            0,
                            newStock
                        )

                });

            }
        );


        // ----------------------------------------------------
        // products と eventInventory を
        // 同じトランザクションで保存
        // ----------------------------------------------------

        await new Promise(
            (resolve, reject) => {

                const transaction =
                    db.transaction(
                        [
                            "products",
                            "eventInventory"
                        ],
                        "readwrite"
                    );


                const productStore =
                    transaction.objectStore(
                        "products"
                    );


                const inventoryStore =
                    transaction.objectStore(
                        "eventInventory"
                    );


                // --------------------------------------------
                // マスター在庫を保存
                // --------------------------------------------

                productUpdates.forEach(
                    update => {

                        const product =
                            update.product;


                        product.stock =
                            update.newStock;


                        product.updatedAt =
                            new Date().toISOString();


                        productStore.put(
                            product
                        );

                    }
                );


                // --------------------------------------------
                // イベント開始在庫を保存
                // --------------------------------------------

                saveData.forEach(
                    data => {

                        inventoryStore.put(
                            data
                        );

                    }
                );


                // --------------------------------------------
                // 完了
                // --------------------------------------------

                transaction.oncomplete =
                    () => {

                        resolve();

                    };


                transaction.onerror =
                    () => {

                        reject(
                            transaction.error ||
                            new Error(
                                "保存に失敗しました。"
                            )
                        );

                    };


                transaction.onabort =
                    () => {

                        reject(
                            transaction.error ||
                            new Error(
                                "保存が中断されました。"
                            )
                        );

                    };

            }
        );


        // ----------------------------------------------------
        // 商品一覧を再読み込み
        // ----------------------------------------------------

        await loadProducts();


        // ----------------------------------------------------
        // イベント開始在庫を再読み込み
        // ----------------------------------------------------

        await loadEventStartInventory(
            eventId
        );


        // ----------------------------------------------------
        // 売上集計も更新
        // ----------------------------------------------------

        await loadEventSalesSummary(
            eventId
        );


        // ----------------------------------------------------
        // 利益集計も更新
        // ----------------------------------------------------

        await loadEventProfitSummary(
            eventId
        );


        alert(
            "開始在庫・販売数を保存しました。\n\n" +
            "マスター在庫も更新しました。"
        );


    } catch (error) {

        console.error(
            "イベント開始在庫・販売数保存エラー",
            error
        );


        alert(
            "イベント開始在庫・販売数の保存に失敗しました。\n\n" +
            "エラー：" +
            (error?.message || error)
        );

    }

}

// ------------------------------------------------------------
// イベント追加モーダルを開く
// ------------------------------------------------------------

function openEventModal() {

    const modal =
        document.getElementById(
            "event-modal"
        );

    if (!modal) {
        return;
    }


    document.getElementById(
        "event-name"
    ).value = "";


    document.getElementById(
        "event-date"
    ).value = "";


    document.getElementById(
        "event-memo"
    ).value = "";


    modal.style.display = "flex";

}


// ------------------------------------------------------------
// イベント追加モーダルを閉じる
// ------------------------------------------------------------

function closeEventModal() {

    const modal =
        document.getElementById(
            "event-modal"
        );


    if (!modal) {
        return;
    }


    modal.style.display = "none";

}


// ------------------------------------------------------------
// イベント保存
// ------------------------------------------------------------

async function saveEvent() {

    const name =
        document.getElementById(
            "event-name"
        ).value.trim();


    const date =
        document.getElementById(
            "event-date"
        ).value;


    const memo =
        document.getElementById(
            "event-memo"
        ).value.trim();


    if (!name) {

        alert(
            "イベント名を入力してください。"
        );

        return;
    }


    if (!date) {

        alert(
            "開催日を入力してください。"
        );

        return;
    }


    const eventData = {

        id: createId(),

        name: name,

        date: date,

        memo: memo,

        createdAt:
            new Date().toISOString()

    };


    try {

        await new Promise(
            (resolve, reject) => {

                const transaction =
                    db.transaction(
                        ["events"],
                        "readwrite"
                    );


                const store =
                    transaction.objectStore(
                        "events"
                    );


                const request =
                    store.add(eventData);


                request.onsuccess = () => {

                    resolve();

                };


                request.onerror = () => {

                    reject(
                        request.error
                    );

                };


                transaction.onerror = () => {

                    reject(
                        transaction.error
                    );

                };

            }
        );


        closeEventModal();

        await loadEvents();


    } catch (error) {

        console.error(
            "イベント保存エラー",
            error
        );


        alert(
            "イベントの保存に失敗しました。\n\n" +
            "エラー：" +
            (error?.message || error)
        );

    }

}
// ============================================================
// 初期化
// ============================================================

async function initializeApp() {

    try {

        await openDatabase();

        await requestPersistentStorage();

        createInventoryAdjustModal();

        setupEventListeners();

        showSection(
            "products-section"
        );

    } catch (error) {

        console.error(
            "アプリ初期化エラー",
            error
        );


        alert(
            "アプリの初期化に失敗しました。\n\n" +
            "エラー：" +
            (error?.message || error)
        );

    }

}


// ============================================================
// 起動
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);

// ============================================================
// データバックアップ ボタン
// ============================================================

document
    .getElementById("export-backup-button")
    ?.addEventListener(
        "click",
        () => {
            exportBackup();
        }
    );


document
    .getElementById("import-backup-button")
    ?.addEventListener(
        "click",
        () => {

            document
                .getElementById("import-backup-file")
                ?.click();

        }
    );


document
    .getElementById("import-backup-file")
    ?.addEventListener(
        "change",
        event => {

            const file =
                event.target.files?.[0];


            if (!file) {

                return;

            }


            importBackupFile(
                file
            );


            // 同じファイルをもう一度選べるようにする
            event.target.value = "";

        }
    );

    // ============================================================
// イベント削除
// ============================================================

async function deleteEvent(eventId) {

    if (!eventId) {
        return;
    }

    const event =
        await getEventById(eventId);

    if (!event) {
        alert("イベントが見つかりません。");
        return;
    }

    const confirmed =
        confirm(
            `「${event.name}」を削除しますか？\n\n` +
            "このイベントに登録されている\n" +
            "・イベント在庫\n" +
            "・イベント経費\n" +
            "も一緒に削除されます。\n\n" +
            "この操作は元に戻せません。"
        );

    if (!confirmed) {
        return;
    }

    try {

        await new Promise(
            (resolve, reject) => {

                const transaction =
                    db.transaction(
                        [
                            "events",
                            "eventInventory",
                            "eventExpenses"
                        ],
                        "readwrite"
                    );

                // ------------------------------------------------
                // イベント本体
                // ------------------------------------------------

                const eventStore =
                    transaction.objectStore(
                        "events"
                    );

                eventStore.delete(
                    eventId
                );


                // ------------------------------------------------
                // イベント在庫
                // ------------------------------------------------

                const inventoryStore =
                    transaction.objectStore(
                        "eventInventory"
                    );

                const inventoryRequest =
                    inventoryStore.getAll();

                inventoryRequest.onsuccess =
                    () => {

                        const records =
                            inventoryRequest.result || [];

                        records.forEach(
                            record => {

                                if (
                                    String(
                                        record.eventId
                                    ) ===
                                    String(
                                        eventId
                                    )
                                ) {

                                    inventoryStore.delete(
                                        record.id
                                    );

                                }

                            }
                        );

                    };


                // ------------------------------------------------
                // イベント経費
                // ------------------------------------------------

                const expenseStore =
                    transaction.objectStore(
                        "eventExpenses"
                    );

                const expenseRequest =
                    expenseStore.getAll();

                expenseRequest.onsuccess =
                    () => {

                        const records =
                            expenseRequest.result || [];

                        records.forEach(
                            record => {

                                if (
                                    String(
                                        record.eventId
                                    ) ===
                                    String(
                                        eventId
                                    )
                                ) {

                                    expenseStore.delete(
                                        record.id
                                    );

                                }

                            }
                        );

                    };


                transaction.oncomplete =
                    () => {

                        resolve();

                    };


                transaction.onerror =
                    () => {

                        reject(
                            transaction.error
                        );

                    };


                transaction.onabort =
                    () => {

                        reject(
                            transaction.error ||
                            new Error(
                                "イベント削除が中断されました。"
                            )
                        );

                    };

            }
        );


        await loadEvents();


        alert(
            "イベントを削除しました。"
        );


    } catch (error) {

        console.error(
            "イベント削除エラー",
            error
        );

        alert(
            "イベントの削除に失敗しました。\n\n" +
            "エラー：" +
            (
                error?.message ||
                error
            )
        );

    }

}