/**
 * storage.js - 本地儲存模組 (localStorage)
 */

const STORAGE_KEY = 'zen_mantra_data_v2';

const StorageModule = {
  /**
   * 載入儲存資料，並與預設 CONFIG 合併 (確保向前相容)
   * @param {Object} defaultConfig 
   * @returns {Object}
   */
  loadData(defaultConfig) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return { ...defaultConfig };
      return { ...defaultConfig, ...JSON.parse(saved) };
    } catch (e) {
      console.error('讀取 localStorage 失敗:', e);
      return { ...defaultConfig };
    }
  },

  /**
   * 儲存資料
   * @param {Object} data 
   */
  saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('寫入 localStorage 失敗:', e);
    }
  }
};