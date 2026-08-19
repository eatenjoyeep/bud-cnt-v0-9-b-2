收到！明白你的意思。這次我只專注將**所有討論過的設計理念、UI 結構、Setting 細節、資料架構與防誤觸機制**完整收錄進 `README.md`，不做其他多餘的程式碼輸出。

以下是為你整納完全部細節的 **`README.md` 完整檔案**：

```markdown
# 禪意念佛計數器 (Zen Mantra Counter) - Android PWA

一個專為專注念佛/持咒設計的極簡、無干擾（Distraction-free）Android Progressive Web App (PWA)。

---

## 👁️ 核心設計理念 (Core Philosophy)

* **極簡禪意 (Zen UI)**：去除所有不必要的視覺干擾，回歸單純持誦體驗。
* **OLED 純黑優化 (`#000000`)**：極致省電，適合長時間亮屏使用，深夜或暗處不刺眼。
* **全螢幕盲點擊 (Blind Operation)**：除了頂部與底部控制區外，全螢幕皆為點擊感應區，無須看螢幕即可順暢計數。
* **日光綠葉語彙 (Sunlight-Green Leaf Motif)**：以 `#4cd964` 綠色象徵生機與平靜，作為視覺與點綴主色。

---

## 🛠️ 技術棧與 Web APIs (Tech Stack)

* **前端核心**：HTML5, CSS3, Vanilla JavaScript (原生 ES6 Modules)
* **PWA 支援**：Web App Manifest + Service Worker (支援離線使用與安裝至手機主畫面)
* **Web APIs**：
  * **Web Audio API**：原生合成/播放木魚 (Mugyu) 音效
  * **Vibration API**：觸覺震動反饋
  * **Screen Wake Lock API**：防止手機螢幕自動休眠/熄屏
  * **Storage API**：使用 `localStorage` 持久化保存計數狀態與設定參數

---

## 📐 畫面與 UI 構型 (Visual & Structural Architecture)

### 1. 頂部控制列 (Top Bar)
* **左：重置按鈕 (`↺`)**
  * 點擊觸發「重置確認 Dialog」，防止盲操作或點擊螢幕時誤觸清零。
* **中：目標進度膠囊 (`0 / 108`) + 隱藏切換按鈕 (`👁️`)**
  * 採用綠色半透明邊框膠囊造型。
  * 目標數字下方帶有虛線/劃線點綴。
  * 點擊眼睛圖示可切換大數字與進度的半透明/隱藏狀態，避免對數字產生執念。
* **右：設定按鈕 (`⚙️`)**
  * 點擊開啟原生 `<dialog>` 設定 Modal。

### 2. 中央區域 (Core Display)
* **大數字計數器 (`#counter-value`)**：採用圓潤質感的灰色字型 (`#a0a0a5`)，放大居中。
* **全螢幕盲點擊區 (`#touch-zone`)**：全螢幕觸控感應，單擊任意位置即可增加計數。

### 3. 底部區域 (Bottom Bar)
* **綠葉 Motif**：對稱/居中放置陽光綠葉 SVG 圖示 (`#4cd964`)，維持視覺平衡與禪意氛圍。

---

## ⚙️ 設定選單與資料架構 (Settings & Data Model)

### 1. Setting Modal 可調參數 (`<dialog>`)
點擊右上角 `⚙️` 開啟，包含以下四大完整設定：
1. **目標計數 (Target Count)**：數字輸入框 (`<input type="number">`，預設 `108`，可自訂如 `1080` 或其他數字)。
2. **木魚音效 (Sound Toggle)**：音效開關（預設 `On`）。
3. **觸覺震動 (Vibration Toggle)**：震動反饋開關（預設 `On`）。
4. **螢幕常亮 (Wake Lock Toggle)**：螢幕防休眠開關（預設 `On`）。

### 2. 前向相容資料模型 (Object-Merging Strategy)
為了確保未來版本新增 Setting 項目時不破壞舊用戶在 `localStorage` 內的資料，採用預設物件合併策略：

```javascript
// 預設設定檔 (Default State)
const DEFAULT_SETTINGS = {
  target: 108,
  soundEnabled: true,
  vibrateEnabled: true,
  wakeLockEnabled: true
};

// 讀取與合併邏輯 (Migration & Merge)
// const savedSettings = JSON.parse(localStorage.getItem('zen_mantra_settings')) || {};
// const currentSettings = { ...DEFAULT_SETTINGS, ...savedSettings };

```

* **好處**：當 App 未來更新並加入全新設定 key 時，舊用戶的 `localStorage` 會自動與 `DEFAULT_SETTINGS` 補齊缺漏欄位，確保資料結構永遠完整，防止腳本崩潰。

---

## 🛡️ 防誤觸與盲操作安全機制 (Safety & Blind Touch)

1. **重置確認彈窗 (Reset Modal)**：盲點擊或持機時，若不小心碰到左上角的重置按鈕，必須經由跳出的二次確認 Dialog 點擊「確定」才會真正清零。
2. **設定儲存與即時生效**：在 Setting Modal 調整目標次數、聲音、震動或 Wake Lock 後，按下「儲存」會立即套用並儲存至 `localStorage`。

---

## 📁 專案檔案結構 (Project Structure)

```text
mantra-counter/
├── index.html          # 主頁面 HTML 骨架 (包含主畫面與 2 個 <dialog> Modal)
├── manifest.json       # PWA 清單檔案
├── sw.js               # Service Worker 離線快取腳本
├── README.md           # 專案架構與需求說明文件 (單一事實來源)
├── css/
│   └── style.css       # 全局 OLED 黑主題、進度膠囊與 Modal 樣式
└── js/
    ├── app.js          # 主程式邏輯、事件綁定與 UI 更新
    ├── audio.js        # Web Audio API 木魚音效與震動反饋模組
    ├── storage.js      # localStorage 持久化與 Object-Merge 模組
    └── wakelock.js     # Screen Wake Lock 螢幕常亮控制模組

```

---

## 🚀 開發里程碑 (Development Roadmap)

* [x] **Phase 1: 專案規格、完整 Setting 與 README 確立 (Source of Truth)**
* [ ] **Phase 2: HTML 骨架與 CSS Zen UI 樣式定案 (含 Modal 與防誤觸 UI)**
* [ ] **Phase 3: JavaScript 核心模組開發**
* [ ] `js/storage.js` (資料儲存與 Object-Merge 策略)
* [ ] `js/audio.js` (Web Audio 木魚合成音與 Vibration)
* [ ] `js/wakelock.js` (Screen Wake Lock 控制)
* [ ] `js/app.js` (主流程整合與 Modal 控制)


* [ ] **Phase 4: PWA 離線支援 (`manifest.json` + `sw.js`)**
* [ ] **Phase 5: 最終測試與生成 `FINAL.md` 逆向技術文件**

```

```