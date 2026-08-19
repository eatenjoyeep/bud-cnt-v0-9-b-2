/**
 * app.js - 禪意念佛計數器主控腳本
 */

const CONFIG = {
  count: 0,                   // 初始累計次數
  target: 108,                // 預設目標次數 (0 代表無限)

  soundEnabled: true,         // 是否啟用木魚聲
  chimeEnabled: true,         // 是否啟用圓滿提示聲
  vibrateEnabled: true,       // 是否啟用觸覺震動

  woodblockFreq: 220,         
  woodblockDuration: 0.12,    
  goalChimeFreq: 880,         

  // 觸覺震動設定 (單位: 毫秒)
  // vibeTapPattern: [80] 保持厚實有份量的重震手感
  vibeTapPattern: [80],
  
  // vibeGoalPattern: 圓滿重震自然遞減 [強撞擊 250ms -> 停 80ms -> 中共鳴 140ms -> 停 100ms -> 輕尾震 60ms]
  vibeGoalPattern: [250, 80, 140, 100, 60] 
};

// --------------------------------------------------------------------------
// 📜 離線經典佛偈庫與農曆佛誕計算模組
// --------------------------------------------------------------------------
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
    const formatter = new Intl.DateTimeFormat('zh-TN-u-ca-chinese', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
    const parts = formatter.formatToParts(t);
    let lYear = 0, lMonth = 1, lDay = 1;
    for (const part of parts) {
      if (part.type === 'year') lYear = parseInt(part.value, 10);
      if (part.type === 'month') lMonth = parseInt(part.value, 10);
      if (part.type === 'day') lDay = parseInt(part.value, 10);
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

  // 獲取 DOM 元素
  const touchZone = document.getElementById('touch-zone');
  const counterValue = document.getElementById('counter-value');
  const targetDisplay = document.getElementById('target-display');
  const btnTarget = document.getElementById('btn-target');
  
  const btnReset = document.getElementById('btn-reset');
  const btnSettings = document.getElementById('btn-settings');
  const btnToggleEye = document.getElementById('btn-toggle-eye');
  
  const targetDialog = document.getElementById('target-dialog');
  const targetDialogInput = document.getElementById('target-dialog-input');
  const btnSaveTarget = document.getElementById('btn-save-target');

  const settingsDialog = document.getElementById('settings-dialog');
  const settingSound = document.getElementById('setting-sound');
  const settingSoundChime = document.getElementById('setting-sound-chime');
  const settingVibrate = document.getElementById('setting-vibrate');
  const btnSaveSettings = document.getElementById('btn-save-settings');

  const resetDialog = document.getElementById('reset-dialog');
  const btnConfirmReset = document.getElementById('btn-confirm-reset');
  const btnCancelReset = document.getElementById('btn-cancel-reset');
  
  const goalDialog = document.getElementById('goal-dialog');
  const goalMessage = document.getElementById('goal-message');
  const nextTargetInput = document.getElementById('next-target-input');
  const btnStartNextRound = document.getElementById('btn-start-next-round');

  // 🌸 歡迎畫面與退出卡片 DOM 元素
  const welcomeOverlay = document.getElementById('welcome-overlay');
  const welcomeSolarDate = document.getElementById('welcome-solar-date');
  const welcomeLunarDate = document.getElementById('welcome-lunar-date');
  const welcomeBuddhistEvent = document.getElementById('welcome-buddhist-event');
  const welcomeQuote = document.getElementById('welcome-quote');

  const exitCard = document.getElementById('exit-card');
  const btnContinueApp = document.getElementById('btn-continue-app');
  const btnLeaveApp = document.getElementById('btn-leave-app');

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
  let exitTimer = null;   // 退出提示的自動消失計時器

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
  welcomeOverlay.addEventListener('click', () => {
    elevateToState2();
  });

  // 分支 A：點擊「繼續持誦」按鈕，升到 State 2 並隱藏提示
  btnContinueApp.addEventListener('click', (e) => {
    e.stopPropagation();
    // 清除自動消失計時器
    if (exitTimer) {
      clearTimeout(exitTimer);
      exitTimer = null;
    }
    history.pushState({ state: 2 }, '');
    currentState = 2;
    hideExitPromptUI();
  });

  // 分支 B：點擊「再按一次返回鍵退出」選項，退回 State 0 離開 App
  btnLeaveApp.addEventListener('click', (e) => {
    e.stopPropagation();
    // 清除自動消失計時器
    if (exitTimer) {
      clearTimeout(exitTimer);
      exitTimer = null;
    }
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

    // 如果已經在退出提示狀態（State 1），表示用戶第二次按返回鍵
    if (currentState === 1) {
      // 清除計時器，避免干擾
      if (exitTimer) {
        clearTimeout(exitTimer);
        exitTimer = null;
      }
      // 不做任何 UI 改動，讓 popstate 自然後退，系統會退出 App
      return;
    }

    // 狀態 2 -> 1：第一次按返回鍵，顯示退出提示
    currentState = 1;
    setDimmedMode(false);
    showExitPromptUI();

    if (appState.vibrateEnabled) {
      SoundSynthesizer.vibrate([30]);
    }

    // 啟動 2 秒計時器，若無操作自動恢復 State 2
    exitTimer = setTimeout(() => {
      hideExitPromptUI();
      history.pushState({ state: 2 }, '');
      currentState = 2;
      exitTimer = null;
    }, 2000);
  });

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
    counterValue.textContent = appState.count;

    if (appState.target === 0) {
      targetDisplay.textContent = '∞';
    } else {
      targetDisplay.textContent = appState.target;
    }
  }

  // 全螢幕盲點擊 (+1 邏輯)
  // 💡 改用 pointerdown：手指剛觸碰螢幕（0ms）即刻發聲與震動，徹底消除抬手延遲
  touchZone.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.top-bar') || e.target.closest('dialog')) {
      return;
    }

    // 點擊 +1 自動進入減光模式
    setDimmedMode(true);

    appState.count++;
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
      nextTargetInput.value = appState.target;
      
      setTimeout(() => {
        goalDialog.showModal();
      }, 150);

    } else {
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
  // 🎯 按下「目標數字」：專屬開啟修改目標 Dialog & 儲存邏輯
  // --------------------------------------------------------------------------
  btnTarget.addEventListener('click', (e) => {
    e.stopPropagation();
    setDimmedMode(false);
    targetDialogInput.value = appState.target;
    targetDialog.showModal();
  });

  function saveTarget() {
    const parsedTarget = parseInt(targetDialogInput.value, 10);
    const newTarget = isNaN(parsedTarget) || parsedTarget < 0 ? 0 : parsedTarget;

    if (newTarget !== appState.target) {
      appState.target = newTarget;
      appState.count = 0;
    }

    updateUI();
    StorageModule.saveData(appState);
    targetDialog.close();
  }

  btnSaveTarget.addEventListener('click', saveTarget);

  targetDialogInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTarget();
    }
  });

  // --------------------------------------------------------------------------
  // ⚙ 按下「設定」按鈕：專屬開啟 3 項設定 Modal
  // --------------------------------------------------------------------------
  btnSettings.addEventListener('click', (e) => {
    e.stopPropagation();
    setDimmedMode(false);
    settingSound.checked = appState.soundEnabled;
    settingSoundChime.checked = appState.chimeEnabled;
    settingVibrate.checked = appState.vibrateEnabled;
    settingsDialog.showModal();
  });

  btnSaveSettings.addEventListener('click', () => {
    appState.soundEnabled = settingSound.checked;
    appState.chimeEnabled = settingSoundChime.checked;
    appState.vibrateEnabled = settingVibrate.checked;

    updateUI();
    StorageModule.saveData(appState);
    settingsDialog.close();
  });

  // 重置按鈕
  btnReset.addEventListener('click', (e) => {
    e.stopPropagation();
    setDimmedMode(false);
    resetDialog.showModal();
  });

  btnConfirmReset.addEventListener('click', () => {
    appState.count = 0;
    updateUI();
    StorageModule.saveData(appState);
    resetDialog.close();
  });

  btnCancelReset.addEventListener('click', () => {
    resetDialog.close();
  });

  // 圓滿彈窗開始新一輪核心函數
  function startNextRound() {
    const newTarget = parseInt(nextTargetInput.value, 10);
    appState.target = isNaN(newTarget) || newTarget < 0 ? 0 : newTarget;
    appState.count = 0;

    updateUI();
    StorageModule.saveData(appState);
    goalDialog.close();
  }

  btnStartNextRound.addEventListener('click', startNextRound);

  nextTargetInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      startNextRound();
    }
  });

  updateUI();
});