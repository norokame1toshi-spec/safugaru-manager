async function initializeApp() {
    try {
        alert("① initializeApp開始");

        await openDatabase();
        alert("② openDatabase完了");

        await requestPersistentStorage();
        alert("③ requestPersistentStorage完了");

        createInventoryAdjustModal();
        alert("④ createInventoryAdjustModal完了");

        setupEventListeners();
        alert("⑤ setupEventListeners完了");

        showSection("products-section");
        alert("⑥ showSection完了");

        alert("⑦ 初期化完了");

    } catch (error) {
        console.error("アプリ初期化エラー", error);
        alert(
            "アプリの初期化に失敗しました.\n\n" +
            "エラー：" +
            (error?.message || error)
        );
    }
}
