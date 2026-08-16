/**
 * helpers.js
 */

export function debounce(fn, delay = 400) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Capitalize the first letter of a string. */
export function capitalize(str = "") {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function escapeHtml(str = "") {
  const div = document.createElement("div");
  div.textContent = String(str ?? "");
  return div.innerHTML;
}

/** Generate a short, reasonably unique id (good enough for localStorage records). */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** "YYYY-MM-DD" key for a given date — used to bucket food log entries by day. */
export function toDateKey(date = new Date()) {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().split("T")[0];
}

/** Human friendly long date, e.g. "Tuesday, Jan 14" */
export function formatDateLong(date = new Date()) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}


export function seededRandom(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function next() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

// Meal Nurtition
export function generateMealNutrition(mealId, servings = 4) {
  const rand = seededRandom(String(mealId));

  const calories = Math.round(280 + rand() * 420); 
  const protein = Math.round(15 + rand() * 35); 
  const carbs = Math.round(20 + rand() * 55); 
  const fat = Math.round(5 + rand() * 28); 
  const fiber = Math.round(2 + rand() * 7); 
  const sugar = Math.round(3 + rand() * 18); 
  const vitaminA = Math.round(5 + rand() * 30);
  const vitaminC = Math.round(5 + rand() * 40);
  const calcium = Math.round(2 + rand() * 20);
  const iron = Math.round(4 + rand() * 20);

  return {
    calories,
    protein,
    carbs,
    fat,
    fiber,
    sugar,
    vitaminA,
    vitaminC,
    calcium,
    iron,
    servings,
    totalCalories: calories * servings,
  };
}
