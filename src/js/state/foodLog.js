/**
 * foodLog.js
 */
import { generateId, toDateKey } from "../utils/helpers.js";

const STORAGE_KEY = "nutriplan_food_log";

export const DAILY_TARGETS = { calories: 2000, protein: 50, carbs: 250, fat: 65 };

export default class FoodLogService {
  constructor() {
    this.data = this._load();
  }

  _load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  _save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  addEntry(entry) {
    const key = toDateKey();
    if (!this.data[key]) this.data[key] = [];

    const record = {
      id: generateId(),
      addedAt: new Date().toISOString(),
      type: "custom",
      name: "Food item",
      image: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      ...entry,
    };

    this.data[key].push(record);
    this._save();
    return record;
  }

  removeEntry(id, dateKey = toDateKey()) {
    if (!this.data[dateKey]) return;
    this.data[dateKey] = this.data[dateKey].filter((e) => e.id !== id);
    this._save();
  }

  clearDay(dateKey = toDateKey()) {
    this.data[dateKey] = [];
    this._save();
  }

  getEntries(dateKey = toDateKey()) {
    return this.data[dateKey] || [];
  }

  getTotals(dateKey = toDateKey()) {
    return this.getEntries(dateKey).reduce(
      (acc, e) => ({
        calories: acc.calories + (Number(e.calories) || 0),
        protein: acc.protein + (Number(e.protein) || 0),
        carbs: acc.carbs + (Number(e.carbs) || 0),
        fat: acc.fat + (Number(e.fat) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }

  /** Totals (+ item count) for the last 7 days (oldest -> newest), used by the Weekly Overview grid. */
  getWeeklyTotals() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = toDateKey(d);
      days.push({
        date: key,
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        count: this.getEntries(key).length,
        ...this.getTotals(key),
      });
    }
    return days;
  }
}
