/**
 * app.js - 禪意念佛計數器主控腳本
 */

const CONFIG = {
  count: 0,                   // 初始累計次數
  target: 1080,               // 預設目標次數 (0 代表無限)

  // 🌸 預設 3 組持誦組合包
  presets: [
    { title: "南無阿彌陀佛", target: 1080, count: 0 },
    { title: "南無觀世音菩薩", target: 1080, count: 0 },
    { title: "大悲咒", target: 21, count: 0 }
  ],
  activePresetIndex: 0,       // 當前啟用的組合包索引 (0, 1, 2)

  soundEnabled: true,         // 是否啟用木魚聲
  chimeEnabled: true,         // 是否啟用圓滿提示聲
  vibrateEnabled: true,       // 是否啟用觸覺震動
  confirmReset: true,         // 清空時彈出確認方塊
  streakThreshold: 21,        // 連續持誦天數門檻 (預設 21 次)

  // 📊 全域歷史紀錄
  history: {
    todayCount: 0,
    monthCount: 0,
    streakDays: 0,
    lastActiveDate: "",       // YYYY-MM-DD
    lastMonth: ""             // YYYY-MM
  },

  woodblockFreq: 220,         
  woodblockDuration: 0.12,    
  goalChimeFreq: 880,         

  // 觸覺震動設定 (單位: 毫秒)
  // vibeTapPattern: [80] 保持厚實有份量的重震手感
  vibeTapPattern: [80],
  
  // vibeGoalPattern: 圓滿重震自然遞減 [強撞擊 250ms -> 停 80ms -> 中共鳴 140ms -> 停 100ms -> 輕尾震 60ms]
  vibeGoalPattern: [250, 80, 140, 100, 60] 
};

// ---------------------------------------------------------------------------
// 📜 離線經典佛偈庫與農曆佛誕計算模組
// ---------------------------------------------------------------------------
const BUDDHIST_QUOTES = [
  "身如菩提樹，心如明鏡臺，時時勤拂拭，勿使惹塵埃。",
  "菩提本無樹，明鏡亦非臺，本來無一物，何處惹塵埃。",
  "一切有為法，如夢幻泡影，如露亦如電，應作如是觀。",
  "由愛故生憂，由愛故生怖，若離於愛者，無憂亦無怖。",
  "凡所有相，皆是虛妄。若見諸相非相，則見如來。",
  "若以色見我，以音聲求我，是人行邪道，不能見如來。",
  "過去心不可得，現在心不可得，未來心不可得。",
  "應無所住而生其心。",
  "狂心頓歇，歇即菩提。",
  "念佛一聲，罪滅河沙；禮佛一拜，福增無量。",
  "觀自在菩薩，行深般若波羅蜜多時，照見五蘊皆空，度一切苦厄。",
  "色不異空，空不異色，色即是空，空即是色。",
  "大慈大悲愍眾生，大喜大捨濟含識。",
  "心如工畫師，能畫諸世間，五蘊悉從生，無法而不造。"
];

// 核心農曆對照與佛教節日資料庫 (農曆月日 -> 節日名稱)
const BUDDHIST_FESTIVALS = {
  "1-1": "彌勒菩薩聖誕",
  "1-15": "上元天官聖誕 · 朔望齋日",
  "2-8": "釋迦牟尼佛出家紀念日",
  "2-15": "釋迦牟尼佛涅槃紀念日",
  "2-19": "觀世音菩薩聖誕",
  "2-21": "普賢菩薩聖誕",
  "3-16": "準提菩薩聖誕",
  "4-4": "文殊菩薩聖誕",
  "4-8": "釋迦牟尼佛誕辰（浴佛節）",
  "4-28": "藥王菩薩聖誕",
  "5-13": "伽藍菩薩聖誕",
  "6-3": "韋驮菩薩聖誕",
  "6-19": "觀世音菩薩成道紀念日",
  "7-13": "大勢至菩薩聖誕",
  "7-15": "佛歡喜日 · 盂蘭盆節",
  "7-30": "地藏王菩薩聖誕",
  "8-15": "月光菩薩聖誕 · 朔望齋日",
  "9-19": "觀世音菩薩出家紀念日",
  "9-30": "藥師琉璃光如來聖誕",
  "10-5": "達摩祖師聖誕",
  "11-17": "阿彌陀佛聖誕",
  "12-8": "釋迦牟尼佛成道日（臘八節）",
  "12-29": "華嚴菩薩聖誕"
};

/**
 * 輕量級純前端農曆計算器 (適用於離線計算)
 */
function getLunarDateInfo(date) {
  const t = new Date(date);
  const year = t.getFullYear();
  const month = t.getMonth() + 1;
  const day = t.getDate();

  // 天干地支
  const tianGan = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const diZhi = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const shengXiao = ["鼠", "牛", "虎", "兔", "龍", "蛇", "馬", "羊", "猴", "雞", "狗", "豬"];
  const lunarMonths = ["正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "臘"];
  const lunarDays = [
    "初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
    "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
    "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"
  ];

  try {
    const formatter = new Intl.DateTimeFormat('en-US-u-ca-chinese', {
      day: 'numeric',
      month: 'numeric'
    });
    const parts = formatter.formatToParts(t);
    let lMonth = 1, lDay = 1;
    for (const part of parts) {
      if (part.type === 'month') lMonth = parseInt(part.value, 10) || 1;
      if (part.type === 'day') lDay = parseInt(part.value, 10) || 1;
    }

    const ganZhiYear = tianGan[(year - 4) % 10] + diZhi[(year - 4) % 12];
    const shengXiaoName = shengXiao[(year - 4) % 12];
    const monthName = lunarMonths[(lMonth - 1) % 12] || "正";
    const dayName = lunarDays[(lDay - 1) % 30] || "初一";

    const key = `${lMonth}-${lDay}`;
    let eventName = BUDDHIST_FESTIVALS[key] || "";

    if (!eventName) {
      if (lDay === 1) eventName = "朔日 · 宜戒殺持齋";
      else if (lDay === 15) eventName = "望日 · 宜戒殺持齋";
      else eventName = "今日無特殊佛誕 · 靜心持誦";
    }

    return {
      solarStr: `${year}年${month}月${day}日`,
      lunarStr: `${ganZhiYear}年 (${shengXiaoName}年) ${monthName}月${dayName}`,
      eventStr: eventName
    };
  } catch (e) {
    return {
      solarStr: `${year}年${month}月${day}日`,
      lunarStr: `農曆節日`,
      eventStr: "靜心持誦 · 勤修戒定慧"
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  let appState = StorageModule.loadData(CONFIG);

  // 🛡️ 舊資料向下相容升級處理 (轉化為 presets 結構，補全 count 屬性)
  if (!Array.isArray(appState.presets) || appState.presets.length < 3) {
    appState.presets = [
      { title: "南無阿彌陀佛", target: 1080, count: appState.count || 0 },
      { title: "南無觀世音菩薩", target: 1080, count: 0 },
      { title: "大悲咒", target: 21, count: 0 }
    ];
  } else {
    appState.presets.forEach(p => {
      if (typeof p.count !== 'number') p.count = 0;
    });
  }

  if (typeof appState.activePresetIndex !== 'number' || appState.activePresetIndex < 0 || appState.activePresetIndex > 2) {
    appState.activePresetIndex = 0;
  }

  if (!appState.history) {
    appState.history = { todayCount: 0, monthCount: 0, streakDays: 0, lastActiveDate: "", lastMonth: "" };
  }
  if (typeof appState.confirmReset !== 'boolean') appState.confirmReset = true;
  if (typeof appState.streakThreshold !== 'number') appState.streakThreshold = 21;

  // 獲取 DOM 元素
  const touchZone = document.getElementById('touch-zone');
  const counterValue = document.getElementById('counter-value');
  const targetDisplay = document.getElementById('target-display');
  const btnTarget = document.getElementById('btn-target');

  // 🌸 持誦聖號 DOM 元素
  const mantraTitleDisplay = document.getElementById('mantra-title-display');
  
  const btnRecords = document.getElementById('btn-records');
  const btnSettings = document.getElementById('btn-settings');
  const btnToggleEye = document.getElementById('btn-toggle-eye');
  
  const targetDialog = document.getElementById('target-dialog');
  const btnSaveTarget = document.getElementById('btn-save-target');
  const btnResetAllPresets = document.getElementById('btn-reset-all-presets');

  const recordsDialog = document.getElementById('records-dialog');
  const recordStreak = document.getElementById('record-streak');
  const recordToday = document.getElementById('record-today');
  const recordMonth = document.getElementById('record-month');
  const recordThresholdHint = document.getElementById('record-threshold-hint');
  const btnResetHistory = document.getElementById('btn-reset-history');
  const btnCloseRecords = document.getElementById('btn-close-records');

  const settingsDialog = document.getElementById('settings-dialog');
  const settingSound = document.getElementById('setting-sound');
  const settingSoundChime = document.getElementById('setting-sound-chime');
  const settingVibrate = document.getElementById('setting-vibrate');
  const settingConfirmReset = document.getElementById('setting-confirm-reset');
  const settingStreakThreshold = document.getElementById('setting-streak-threshold');
  const btnSaveSettings = document.getElementById('btn-save-settings');

  const resetDialog = document.getElementById('reset-dialog');
  const resetModalTitle = document.getElementById('reset-modal-title');
  const resetModalMsg = document.getElementById('reset-modal-msg');
  const btnConfirmReset = document.getElementById('btn-confirm-reset');
  const btnCancelReset = document.getElementById('btn-cancel-reset');
  let resetActionType = "current"; // 'current', 'card', 'all_presets', 'history'
  let pendingResetIndex = -1;
  
  const goalDialog = document.getElementById('goal-dialog');
  const goalMessage = document.getElementById('goal-message');
  const btnCompleteDone = document.getElementById('btn-complete-done');
  const btnBackToChant = document.getElementById('btn-back-to-chant');

  // 🌸 歡迎畫面與退出卡片 DOM 元素
  const welcomeOverlay = document.getElementById('welcome-overlay');
  const welcomeSolarDate = document.getElementById('welcome-solar-date');
  const welcomeLunarDate = document.getElementById('welcome-lunar-date');
  const welcomeBuddhistEvent = document.getElementById('welcome-buddhist-event');
  const welcomeQuote = document.getElementById('welcome-quote');

  const exitCard = document.getElementById('exit-card');
  const btnContinueApp = document.getElementById('btn-continue-app');
  const btnLeaveApp = document.getElementById('btn-leave-app');

  // 切換減光 / 正常光度
  function setDimmedMode(enableDim) {
    if (enableDim) {
      document.body.classList.add('is-dimmed');
      btnToggleEye.textContent = '🙈';
    } else {
      document.body.classList.remove('is-dimmed');
      btnToggleEye.textContent = '👁';
    }
  }

  function updateUI() {
    // 取得當前生效的組合包
    const currentPreset = appState.presets[appState.activePresetIndex] || CONFIG.presets[0];
    appState.target = currentPreset.target; // 同步目前生效目標數字
    appState.count = currentPreset.count || 0; // 同步目前生效已完成次數

    counterValue.textContent = appState.count;

    if (appState.target === 0) {
      targetDisplay.textContent = '∞';
    } else {
      targetDisplay.textContent = appState.target;
    }

    // 🌸 更新持誦名稱與動態字間距 (11 字以上自動收緊)
    const currentTitle = currentPreset.title || '南無阿彌陀佛';
    mantraTitleDisplay.textContent = currentTitle;
    mantraTitleDisplay.classList.toggle('is-long-title', currentTitle.length >= 11);

    // 更新歷史紀錄彈窗資料
    recordStreak.textContent = `${appState.history.streakDays} 天`;
    recordToday.textContent = `${appState.history.todayCount} 次`;
    recordMonth.textContent = `${appState.history.monthCount} 次`;
    recordThresholdHint.textContent = `(每日需滿 ${appState.streakThreshold} 次)`;
  }

  // 日期自動升級與跨日/跨月結算判定
  function checkDateRollover() {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let isUpdated = false;

    // 跨月清空本月統計
    if (appState.history.lastMonth !== monthStr) {
      appState.history.monthCount = 0;
      appState.history.lastMonth = monthStr;
      isUpdated = true;
    }

    // 跨日清空今日統計並結算連續天數，同時重置所有組合包的持誦次數
    if (appState.history.lastActiveDate !== todayStr) {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      // 若昨天未達門檻且不是剛初始化的狀態，連續天數斷開歸零
      if (appState.history.lastActiveDate !== yesterdayStr && appState.history.lastActiveDate !== "") {
        appState.history.streakDays = 0;
      }

      // 🌸 重置所有持誦組合包的已完成次數
      if (Array.isArray(appState.presets)) {
        appState.presets.forEach(p => p.count = 0);
      }

      appState.history.todayCount = 0;
      appState.history.lastActiveDate = todayStr;
      isUpdated = true;
    }

    if (isUpdated) {
      StorageModule.saveData(appState);
      if (typeof updateUI === 'function') {
        updateUI(); // 確保若用家正看著螢幕跨日，畫面數字能即時更新歸零
      }
    }
  }

  // 午夜精確倒數定時器 (Midnight Timer)
  let midnightTimer = null;
  function scheduleMidnightReset() {
    if (midnightTimer) clearTimeout(midnightTimer);

    const now = new Date();
    // 計算下一個 00:00:01 的時間點（多預留 1 秒確保跨日時間完全成立）
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0, 0, 1
    );
    const msToMidnight = nextMidnight.getTime() - now.getTime();

    midnightTimer = setTimeout(() => {
      checkDateRollover();
      scheduleMidnightReset(); // 自動排程下一天的午夜倒數
    }, msToMidnight);
  }

  // 監聽前景喚醒事件 (Foreground Wakeup Check)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkDateRollover();
      scheduleMidnightReset(); // 解鎖畫面時重新校正午夜定時器
    }
  });

  checkDateRollover();
  scheduleMidnightReset();

  // 初始化歡迎畫面日期與每日佛偈
  const today = new Date();
  const dateInfo = getLunarDateInfo(today);
  welcomeSolarDate.textContent = dateInfo.solarStr;
  welcomeLunarDate.textContent = dateInfo.lunarStr;
  welcomeBuddhistEvent.textContent = dateInfo.eventStr;

  // 根據一年中的天數輪播經典佛偈
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today - startOfYear;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const selectedQuote = BUDDHIST_QUOTES[dayOfYear % BUDDHIST_QUOTES.length];
  welcomeQuote.textContent = `「${selectedQuote}」`;

  // --------------------------------------------------------------------------
  // 📱 PWA 返回鍵與歷史堆疊（History Stack）0、1、2 狀態模型
  // --------------------------------------------------------------------------
  
  // 追蹤當前狀態：剛打開 App 時為 State 1（未有任何點擊，history.length = 1）
  let currentState = 1;

  function showExitPromptUI() {
    exitCard.classList.remove('is-hidden');
  }

  function hideExitPromptUI() {
    exitCard.classList.add('is-hidden');
  }

  // State 1 -> State 2 提升狀態的核心邏輯
  function elevateToState2() {
    if (currentState === 1) {
      welcomeOverlay.classList.add('is-hidden');
      history.pushState({ state: 2 }, '');
      currentState = 2;
      hideExitPromptUI();
    }
  }

  // 點擊歡迎頁畫面任意處（含提示框）均升至 State 2
  welcomeOverlay.addEventListener('click', elevateToState2);

  // 分支 A：點擊「繼續持誦」按鈕，升到 State 2 並隱藏提示
  btnContinueApp.addEventListener('click', (e) => {
    e.stopPropagation();
    history.pushState({ state: 2 }, '');
    currentState = 2;
    hideExitPromptUI();
  });

  // 分支 B：點擊「再按一次返回鍵退出」選項，退回 State 0 離開 App
  btnLeaveApp.addEventListener('click', (e) => {
    e.stopPropagation();
    history.back(); // 觸發退至 State 0，瀏覽器原生關閉 / 退出 App
  });

  window.addEventListener('popstate', () => {
    // 若當前有開啟的 Modal，優先關閉 Modal 且補回 State 2 緩衝鎖
    const openDialog = document.querySelector('dialog[open]');
    if (openDialog) {
      openDialog.close();
      history.pushState({ state: 2 }, '');
      currentState = 2;
      return;
    }

    // 按第 1 下返回鍵 (-1)：從 State 2 退回 State 1
    // 自動恢復正常光度以清晰顯示選項，並彈出上下堆疊卡片
    currentState = 1;
    setDimmedMode(false);
    showExitPromptUI();

    if (appState.vibrateEnabled) {
      SoundSynthesizer.vibrate([30]); // 微輕觸覺反饋
    }

    // 若再按第 2 下返回鍵，底層歷史紀錄再次 -1 退到 State 0。
    // 此處不再執行 pushState()，系統判定退無可退，將直接順暢關閉 / 退出 App。
  });

  // 全螢幕盲點擊 (+1 邏輯)
  // 💡 改用 pointerdown：手指剛觸碰螢幕（0ms）即刻發聲與震動，徹底消除抬手延遲
  touchZone.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.top-bar') || e.target.closest('dialog') || e.target.closest('#exit-card')) {
      return;
    }

    // 🌸 關鍵修正：若處於 State 1（顯示退出提示或歡迎頁），點擊螢幕僅負責「恢復持誦狀態」，不進行 +1 計數
    if (currentState === 1) {
      elevateToState2();
      return;
    }

    // 點擊 +1 自動進入減光模式
    setDimmedMode(true);

    checkDateRollover();

    // 當前輪與全域紀錄累加
    appState.count++;
    appState.presets[appState.activePresetIndex].count = appState.count;
    appState.history.todayCount++;
    appState.history.monthCount++;

    // 🌟 當今日累計正好到達設定門檻（例如 21 次）時，連續天數正式 +1
    if (appState.history.todayCount === appState.streakThreshold) {
      appState.history.streakDays++;
    }

    updateUI();
    StorageModule.saveData(appState);

    counterValue.classList.add('tap-active');
    setTimeout(() => counterValue.classList.remove('tap-active'), 50);

    const isGoal = (appState.target > 0) && (appState.count % appState.target === 0);

    if (isGoal) {
      // 達標：自動恢復正常光度
      setDimmedMode(false);

      if (appState.chimeEnabled) SoundSynthesizer.playChime(appState.goalChimeFreq, 3.5);
      if (appState.vibrateEnabled) {
        SoundSynthesizer.vibrate(CONFIG.vibeGoalPattern);
      }

      goalMessage.textContent = `恭喜圓滿完成 ${appState.count} 次持誦！`;
      
      // 延遲 150ms 開啟彈窗，避免 Modal 獲得焦點時被系統中斷震動
      setTimeout(() => {
        goalDialog.showModal();
      }, 150);

    } else {
      // 平時點擊，播放一般木魚聲與沉重震動 (80ms)
      SoundSynthesizer.playWoodblock(appState);
      if (appState.vibrateEnabled) {
        SoundSynthesizer.vibrate(CONFIG.vibeTapPattern);
      }
    }
  });

  // 眼睛按鈕切換
  btnToggleEye.addEventListener('click', (e) => {
    e.stopPropagation();
    const isCurrentlyDimmed = document.body.classList.contains('is-dimmed');
    setDimmedMode(!isCurrentlyDimmed);
  });

  // --------------------------------------------------------------------------
  // 🎯 點擊左上角深灰膠囊：開啟 3 組預設卡片管理 Modal
  // --------------------------------------------------------------------------
  function renderTargetDialogData() {
    for (let i = 0; i < 3; i++) {
      const preset = appState.presets[i] || CONFIG.presets[i];
      document.getElementById(`setting-title-${i}`).value = preset.title;
      document.getElementById(`setting-target-${i}`).value = preset.target;
      document.getElementById(`card-count-${i}`).textContent = preset.count || 0;

      const card = document.getElementById(`preset-card-${i}`);
      const isCurrentActive = (i === appState.activePresetIndex);
      card.classList.toggle('is-active-card', isCurrentActive);
      
      const selectBtn = card.querySelector('.btn-card-select');
      if (selectBtn) {
        selectBtn.textContent = isCurrentActive ? '啟用中' : '切換至此組合';
        selectBtn.disabled = isCurrentActive;
      }
    }
  }

  btnTarget.addEventListener('click', (e) => {
    e.stopPropagation();
    setDimmedMode(false);
    renderTargetDialogData();
    targetDialog.showModal();
  });

  // 監聽卡片切換按鈕
  document.querySelectorAll('.btn-card-select').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      if (!isNaN(idx) && idx !== appState.activePresetIndex) {
        appState.activePresetIndex = idx;
        updateUI();
        StorageModule.saveData(appState);
        renderTargetDialogData();
      }
    });
  });

  // ↺ 清空單一卡片組合
  document.querySelectorAll('.btn-card-reset').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      if (isNaN(idx)) return;

      const targetTitle = appState.presets[idx].title || `組合${idx + 1}`;

      if (appState.confirmReset) {
        resetActionType = "card";
        pendingResetIndex = idx;
        resetModalTitle.textContent = `確認歸零「${targetTitle}」？`;
        resetModalMsg.textContent = "此操作將重置該組合的已完成次數。";
        resetDialog.showModal();
      } else {
        appState.presets[idx].count = 0;
        updateUI();
        StorageModule.saveData(appState);
        renderTargetDialogData();
      }
    });
  });

  // ⚠️ 一鍵清空全部 3 組 (強制彈出二次確認)
  btnResetAllPresets.addEventListener('click', () => {
    resetActionType = "all_presets";
    resetModalTitle.textContent = "⚠️ 確認清空全部 3 組？";
    resetModalMsg.textContent = "此操作將強制重置所有 3 組項目的持誦次數，無法復原。";
    resetDialog.showModal();
  });

  // 保存持誦組合卡片
  btnSaveTarget.addEventListener('click', () => {
    for (let i = 0; i < 3; i++) {
      let tVal = document.getElementById(`setting-title-${i}`).value.trim();
      if (!tVal) tVal = CONFIG.presets[i].title;

      let numVal = parseInt(document.getElementById(`setting-target-${i}`).value, 10);
      if (isNaN(numVal) || numVal < 0) numVal = 0;

      appState.presets[i].title = tVal;
      appState.presets[i].target = numVal;
    }

    updateUI();
    StorageModule.saveData(appState);
    targetDialog.close();
  });

  // --------------------------------------------------------------------------
  // 📊 歷史紀錄 Modal
  // --------------------------------------------------------------------------
  btnRecords.addEventListener('click', (e) => {
    e.stopPropagation();
    setDimmedMode(false);
    updateUI();
    recordsDialog.showModal();
  });

  btnCloseRecords.addEventListener('click', () => recordsDialog.close());

  // 重置歷史紀錄
  btnResetHistory.addEventListener('click', () => {
    recordsDialog.close();
    resetActionType = "history";
    resetModalTitle.textContent = "確認重置歷史紀錄？";
    resetModalMsg.textContent = "此操作將清空今日、本月與連續持誦天數，無法復原。";
    resetDialog.showModal();
  });

  // --------------------------------------------------------------------------
  // ⚙ 按下「設定」按鈕：專屬開啟設定 Modal
  // --------------------------------------------------------------------------
  btnSettings.addEventListener('click', (e) => {
    e.stopPropagation();
    setDimmedMode(false);

    settingSound.checked = appState.soundEnabled;
    settingSoundChime.checked = appState.chimeEnabled;
    settingVibrate.checked = appState.vibrateEnabled;
    settingConfirmReset.checked = appState.confirmReset;
    settingStreakThreshold.value = appState.streakThreshold;
    settingsDialog.showModal();
  });

  // 保存設定
  btnSaveSettings.addEventListener('click', () => {
    appState.soundEnabled = settingSound.checked;
    appState.chimeEnabled = settingSoundChime.checked;
    appState.vibrateEnabled = settingVibrate.checked;
    appState.confirmReset = settingConfirmReset.checked;

    let th = parseInt(settingStreakThreshold.value, 10);
    if (isNaN(th) || th < 1) th = 21;
    appState.streakThreshold = th;

    updateUI();
    StorageModule.saveData(appState);
    settingsDialog.close();
  });

  // 確認重置二次彈窗處理
  btnConfirmReset.addEventListener('click', () => {
    if (resetActionType === "card" && pendingResetIndex >= 0) {
      appState.presets[pendingResetIndex].count = 0;
      renderTargetDialogData();
    } else if (resetActionType === "all_presets") {
      appState.presets.forEach(p => p.count = 0);
      renderTargetDialogData();
    } else if (resetActionType === "history") {
      appState.history.todayCount = 0;
      appState.history.monthCount = 0;
      appState.history.streakDays = 0;
    }
    updateUI();
    StorageModule.saveData(appState);
    resetDialog.close();
  });

  btnCancelReset.addEventListener('click', () => {
    resetDialog.close();
  });

  // 🌟 目標圓滿彈窗的新按鈕處理（僅關閉彈窗，計數保持不歸零）
  btnCompleteDone.addEventListener('click', () => {
    goalDialog.close();
  });

  btnBackToChant.addEventListener('click', () => {
    goalDialog.close();
  });

  updateUI();
});