/**
 * components.js
 */
import { escapeHtml, toDateKey } from "../utils/helpers.js";

/* ------------------------------------------------------------------ */
/* Loading / skeleton states                                           */
/* ------------------------------------------------------------------ */

export function hideLoadingOverlay() {
  const overlay = document.getElementById("app-loading-overlay");
  if (!overlay) return;
  overlay.style.opacity = "0";
  setTimeout(() => {
    overlay.style.display = "none";
  }, 500);
}

export function renderSkeletonCards(container, count = 6) {
  if (!container) return;
  container.innerHTML = Array.from({ length: count })
    .map(
      () => `
      <div class="bg-white rounded-xl overflow-hidden shadow-sm">
        <div class="h-40 skeleton"></div>
        <div class="p-4 space-y-2">
          <div class="h-4 skeleton rounded"></div>
          <div class="h-3 w-2/3 skeleton rounded"></div>
        </div>
      </div>`
    )
    .join("");
}

function emptyState(icon, title, subtitle) {
  return `
    <div class="col-span-full text-center py-12 text-gray-500 empty-state">
      <i class="fa-solid ${icon} text-4xl mb-3 text-gray-300"></i>
      <p class="font-medium">${title}</p>
      <p class="text-sm">${subtitle}</p>
    </div>`;
}

/* ------------------------------------------------------------------ */
/* Meals & Recipes page                                                */
/* ------------------------------------------------------------------ */

export function renderAreaPills(container, areas, activeArea = null) {
  if (!container) return;
  const pillClass = (isActive) =>
    `area-filter-btn px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
      isActive ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`;

  const allPill = `<button class="${pillClass(!activeArea)}" data-area="">All Cuisines</button>`;
  const areaPills = areas
    .slice(0, 20)
    .map((area) => `<button class="${pillClass(area === activeArea)}" data-area="${escapeHtml(area)}">${escapeHtml(area)}</button>`)
    .join("");

  container.innerHTML = allPill + areaPills;
}

// Per-category visual identity for the "Browse by Meal Type" tiles.
const CATEGORY_STYLES = {
  Beef: { icon: "fa-drumstick-bite", bg: "from-red-50 to-orange-50", border: "border-red-200", iconBg: "from-red-400 to-orange-500" },
  Chicken: { icon: "fa-drumstick-bite", bg: "from-yellow-50 to-orange-50", border: "border-yellow-200", iconBg: "from-yellow-400 to-orange-500" },
  Dessert: { icon: "fa-ice-cream", bg: "from-rose-50 to-pink-50", border: "border-pink-200", iconBg: "from-rose-400 to-pink-500" },
  Lamb: { icon: "fa-drumstick-bite", bg: "from-orange-50 to-red-50", border: "border-orange-200", iconBg: "from-orange-400 to-red-500" },
  Miscellaneous: { icon: "fa-bowl-food", bg: "from-gray-50 to-slate-50", border: "border-gray-200", iconBg: "from-slate-400 to-gray-500" },
  Pasta: { icon: "fa-bowl-food", bg: "from-yellow-50 to-amber-50", border: "border-yellow-200", iconBg: "from-yellow-400 to-amber-500" },
  Pork: { icon: "fa-bacon", bg: "from-rose-50 to-pink-50", border: "border-rose-200", iconBg: "from-rose-400 to-pink-500" },
  Seafood: { icon: "fa-fish", bg: "from-blue-50 to-cyan-50", border: "border-blue-200", iconBg: "from-blue-400 to-cyan-500" },
  Side: { icon: "fa-plate-wheat", bg: "from-green-50 to-emerald-50", border: "border-green-200", iconBg: "from-green-400 to-emerald-500" },
  Starter: { icon: "fa-utensils", bg: "from-purple-50 to-violet-50", border: "border-gray-200", iconBg: "from-slate-400 to-gray-500" },
  Vegan: { icon: "fa-leaf", bg: "from-green-50 to-lime-50", border: "border-green-200", iconBg: "from-green-400 to-emerald-500" },
  Vegetarian: { icon: "fa-seedling", bg: "from-emerald-50 to-teal-50", border: "border-emerald-200", iconBg: "from-emerald-400 to-teal-500" },
  Breakfast: { icon: "fa-egg", bg: "from-orange-50 to-yellow-50", border: "border-orange-200", iconBg: "from-orange-400 to-yellow-500" },
  Goat: { icon: "fa-drumstick-bite", bg: "from-stone-50 to-amber-50", border: "border-stone-200", iconBg: "from-stone-400 to-amber-500" },
};
const DEFAULT_CATEGORY_STYLE = { icon: "fa-utensils", bg: "from-emerald-50 to-teal-50", border: "border-emerald-200", iconBg: "from-emerald-400 to-teal-500" };

function categoryCardTemplate(cat, isActive) {
  const style = CATEGORY_STYLES[cat.name] || DEFAULT_CATEGORY_STYLE;
  const borderClass = isActive ? "border-emerald-400 shadow-md ring-2 ring-emerald-300" : style.border;
  return `
    <div class="category-card bg-gradient-to-br ${style.bg} rounded-xl p-3 border ${borderClass} hover:shadow-md cursor-pointer transition-all group" data-category="${escapeHtml(cat.name)}">
      <div class="flex items-center gap-2.5">
        <div class="text-white w-9 h-9 bg-gradient-to-br ${style.iconBg} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
          <i class="fa-solid ${style.icon}"></i>
        </div>
        <div><h3 class="text-sm font-bold text-gray-900">${escapeHtml(cat.name)}</h3></div>
      </div>
    </div>`;
}

export function renderCategories(container, categories, activeCategory = null) {
  if (!container) return;
  if (!categories.length) {
    container.innerHTML = "";
    return;
  }
  container.innerHTML = categories
    .slice(0, 12)
    .map((cat) => categoryCardTemplate(cat, cat.name === activeCategory))
    .join("");
}

function mealCardTemplate(meal) {
  const category = meal.category || "";
  const area = meal.area || "";
  return `
    <div class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group" data-meal-id="${meal.id}">
      <div class="relative h-48 overflow-hidden">
        <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="${meal.thumbnail}" alt="${escapeHtml(
    meal.name
  )}" loading="lazy" />
        <div class="absolute bottom-3 left-3 flex gap-2">
          ${category ? `<span class="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-full text-gray-700">${escapeHtml(category)}</span>` : ""}
          ${area ? `<span class="px-2 py-1 bg-emerald-500 text-xs font-semibold rounded-full text-white">${escapeHtml(area)}</span>` : ""}
        </div>
      </div>
      <div class="p-4">
        <h3 class="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">${escapeHtml(meal.name)}</h3>
        <p class="text-xs text-gray-600 mb-3 line-clamp-2">Delicious recipe to try!</p>
        <div class="flex items-center justify-between text-xs">
          <span class="font-semibold text-gray-900"><i class="fa-solid fa-utensils text-emerald-600 mr-1"></i>${escapeHtml(category || "Meal")}</span>
          <span class="font-semibold text-gray-500"><i class="fa-solid fa-globe text-blue-500 mr-1"></i>${escapeHtml(area || "—")}</span>
        </div>
      </div>
    </div>`;
}

export function renderMealCards(container, meals) {
  if (!container) return;
  if (!meals.length) {
    container.innerHTML = emptyState("fa-utensils", "No recipes found", "Try a different search or filter");
    return;
  }
  container.innerHTML = meals.map(mealCardTemplate).join("");
}

/* ------------------------------------------------------------------ */
/* Meal Details page                                                   */
/* ------------------------------------------------------------------ */

function macroBar(label, value, max, colorClass) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  return `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full ${colorClass}"></div>
        <span class="text-gray-700">${label}</span>
      </div>
      <span class="font-bold text-gray-900">${value}g</span>
    </div>
    <div class="w-full bg-gray-100 rounded-full h-2">
      <div class="${colorClass} h-2 rounded-full" style="width: ${pct}%"></div>
    </div>`;
}

function buildNutritionFactsHtml(n, source = "estimated") {
  const sourceLabel =
    source === "usda"
      ? `<span class="ml-2 text-[10px] font-semibold text-emerald-600 uppercase">USDA verified</span>`
      : `<span class="ml-2 text-[10px] font-semibold text-gray-400 uppercase">Estimated</span>`;
  return `
    <p class="text-sm text-gray-500 mb-4">Per serving${sourceLabel}</p>
    <div class="text-center py-4 mb-4 bg-linear-to-br from-emerald-50 to-teal-50 rounded-xl">
      <p class="text-sm text-gray-600">Calories per serving</p>
      <p class="text-4xl font-bold text-emerald-600">${n.calories}</p>
      <p class="text-xs text-gray-500 mt-1">Total: ${n.totalCalories} cal</p>
    </div>
    <div class="space-y-4">
      ${macroBar("Protein", n.protein, 60, "bg-emerald-500")}
      ${macroBar("Carbs", n.carbs, 100, "bg-blue-500")}
      ${macroBar("Fat", n.fat, 40, "bg-purple-500")}
      ${macroBar("Fiber", n.fiber, 15, "bg-orange-500")}
      ${macroBar("Sugar", n.sugar, 30, "bg-pink-500")}
    </div>
    <div class="mt-6 pt-6 border-t border-gray-100">
      <h3 class="text-sm font-semibold text-gray-900 mb-3">Vitamins &amp; Minerals (% Daily Value)</h3>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div class="flex justify-between"><span class="text-gray-600">Vitamin A</span><span class="font-medium">${n.vitaminA}%</span></div>
        <div class="flex justify-between"><span class="text-gray-600">Vitamin C</span><span class="font-medium">${n.vitaminC}%</span></div>
        <div class="flex justify-between"><span class="text-gray-600">Calcium</span><span class="font-medium">${n.calcium}%</span></div>
        <div class="flex justify-between"><span class="text-gray-600">Iron</span><span class="font-medium">${n.iron}%</span></div>
      </div>
    </div>`;
}


export function renderMealDetail(meal, nutrition, embedUrl, nutritionSource = "estimated") {
  const section = document.getElementById("meal-details");
  if (!section) return;

  const heroImg = section.querySelector("img");
  if (heroImg) {
    heroImg.src = meal.thumbnail;
    heroImg.alt = meal.name;
  }

  const heroWrap = section.querySelector(".absolute.bottom-0.left-0.right-0.p-8");
  if (heroWrap) {
    const badgesRow = heroWrap.querySelector("div");
    if (badgesRow) {
      const badgeList = [meal.category, meal.area, ...(meal.tags || [])].filter(Boolean).slice(0, 3);
      const colors = ["bg-emerald-500", "bg-blue-500", "bg-purple-500"];
      badgesRow.innerHTML = badgeList
        .map((b, i) => `<span class="px-3 py-1 ${colors[i % colors.length]} text-white text-sm font-semibold rounded-full">${escapeHtml(b)}</span>`)
        .join("");
    }
    const titleEl = heroWrap.querySelector("h1");
    if (titleEl) titleEl.textContent = meal.name;
  }

  const servingsEl = document.getElementById("hero-servings");
  if (servingsEl) servingsEl.textContent = `${nutrition.servings} servings`;
  const caloriesEl = document.getElementById("hero-calories");
  if (caloriesEl) caloriesEl.textContent = `${nutrition.calories} cal/serving`;

  const logBtn = document.getElementById("log-meal-btn");
  if (logBtn) logBtn.dataset.mealId = meal.id;

  const leftCol = section.querySelector(".lg\\:col-span-2");
  if (leftCol) {
    const [ingredientsCard, instructionsCard, videoCard] = leftCol.children;
    const ingredients = meal.ingredients || [];
    const steps = meal.instructions && meal.instructions.length ? meal.instructions : ["No instructions provided."];

    if (ingredientsCard) {
      const countEl = ingredientsCard.querySelector("h2 span");
      if (countEl) countEl.textContent = `${ingredients.length} items`;
      const grid = ingredientsCard.querySelector(".grid");
      if (grid) {
        grid.innerHTML = ingredients
          .map(
            (ing) => `
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors">
            <input type="checkbox" class="ingredient-checkbox w-5 h-5 text-emerald-600 rounded border-gray-300" />
            <span class="text-gray-700"><span class="font-medium text-gray-900">${escapeHtml(ing.measure)}</span> ${escapeHtml(
              ing.ingredient
            )}</span>
          </div>`
          )
          .join("");
      }
    }

    if (instructionsCard) {
      const stepsContainer = instructionsCard.querySelector(".space-y-4");
      if (stepsContainer) {
        stepsContainer.innerHTML = steps
          .map(
            (step, i) => `
          <div class="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
            <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">${i + 1}</div>
            <p class="text-gray-700 leading-relaxed pt-2">${escapeHtml(step)}</p>
          </div>`
          )
          .join("");
      }
    }

    if (videoCard) {
      const iframe = videoCard.querySelector("iframe");
      if (iframe) {
        if (embedUrl) {
          iframe.src = embedUrl;
          videoCard.style.display = "";
        } else {
          videoCard.style.display = "none";
        }
      }
    }
  }

  const nutritionContainer = document.getElementById("nutrition-facts-container");
  if (nutritionContainer) nutritionContainer.innerHTML = buildNutritionFactsHtml(nutrition, nutritionSource);
}

/* ------------------------------------------------------------------ */
/* Product Scanner page                                                */
/* ------------------------------------------------------------------ */

const NUTRI_SCORE_COLORS = {
  a: "bg-green-500",
  b: "bg-lime-500",
  c: "bg-yellow-500",
  d: "bg-orange-500",
  e: "bg-red-500",
  unknown: "bg-gray-400",
};

function num(v, digits = 1) {
  const n = Number(v);
  return Number.isFinite(n) ? +n.toFixed(digits) : 0;
}

function productCardTemplate(p) {
  const grade = (p.nutritionGrade || "unknown").toLowerCase();
  const scoreColor = NUTRI_SCORE_COLORS[grade] || "bg-gray-400";
  const n = p.nutrients || {};
  // The whole card is clickable — it opens the full detail modal (see showProductModal),
  // which is where the "Log This Food" button actually lives (matches the reference design).
  return `
    <div class="product-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group" data-barcode="${escapeHtml(
      p.barcode
    )}">
      <div class="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
        ${
          p.image
            ? `<img class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" src="${p.image}" alt="${escapeHtml(
                p.name
              )}" loading="lazy" />`
            : `<i class="fa-solid fa-box-open text-4xl text-gray-300"></i>`
        }
        ${grade !== "unknown" ? `<div class="absolute top-2 left-2 ${scoreColor} text-white text-xs font-bold px-2 py-1 rounded uppercase">Nutri-Score ${grade}</div>` : ""}
        ${
          p.novaGroup
            ? `<div class="absolute top-2 right-2 bg-lime-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center" title="NOVA ${p.novaGroup}">${p.novaGroup}</div>`
            : ""
        }
      </div>
      <div class="p-4">
        <p class="text-xs text-emerald-600 font-semibold mb-1 truncate">${escapeHtml(p.brand || "Unknown Brand")}</p>
        <h3 class="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">${escapeHtml(p.name || "Unknown Product")}</h3>
        <div class="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span><i class="fa-solid fa-fire mr-1"></i>${Math.round(n.calories || 0)} kcal/100g</span>
        </div>
        <div class="grid grid-cols-4 gap-1 text-center">
          <div class="bg-emerald-50 rounded p-1.5"><p class="text-xs font-bold text-emerald-700">${num(n.protein)}g</p><p class="text-[10px] text-gray-500">Protein</p></div>
          <div class="bg-blue-50 rounded p-1.5"><p class="text-xs font-bold text-blue-700">${num(n.carbs)}g</p><p class="text-[10px] text-gray-500">Carbs</p></div>
          <div class="bg-purple-50 rounded p-1.5"><p class="text-xs font-bold text-purple-700">${num(n.fat)}g</p><p class="text-[10px] text-gray-500">Fat</p></div>
          <div class="bg-orange-50 rounded p-1.5"><p class="text-xs font-bold text-orange-700">${num(n.sugar)}g</p><p class="text-[10px] text-gray-500">Sugar</p></div>
        </div>
      </div>
    </div>`;
}

export function renderProductCards(container, products) {
  if (!container) return;
  if (!products.length) {
    container.innerHTML = emptyState("fa-barcode", "No products found", "Try another name or check the barcode");
    return;
  }
  container.innerHTML = products.map(productCardTemplate).join("");
}

const NUTRI_SCORE_LABELS = { a: "Excellent", b: "Good", c: "Average", d: "Poor", e: "Bad", unknown: "Unknown" };
const NOVA_LABELS = { 1: "Unprocessed", 2: "Processed culinary", 3: "Processed", 4: "Ultra-processed" };

/**
 * Full product detail modal — image, brand/name, Nutri-Score + NOVA badges,
 * a nutrition facts panel and (when available) an ingredients list, plus a
 * "Log This Food" action. Opened when a product card is clicked.
 *
 * @param {object} product
 * @param {Function} onLog - called when "Log This Food" is clicked
 * @param {Promise<string>|null} [ingredientsPromise] - optional; resolves to
 *   an ingredients string (see ProductsAPI.getIngredientsText). The section
 *   is injected once it resolves, and simply stays hidden if it resolves to
 *   an empty string or is omitted.
 */
export function showProductModal(product, onLog, ingredientsPromise = null) {
  closeProductModal();

  const grade = (product.nutritionGrade || "unknown").toLowerCase();
  const scoreColor = NUTRI_SCORE_COLORS[grade] || "bg-gray-400";
  const n = product.nutrients || {};
  const saltGrams = n.sodium != null ? num(n.sodium * 2.5, 2) : null;

  const overlay = document.createElement("div");
  overlay.id = "product-modal-overlay";
  overlay.className = "fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4";
  overlay.innerHTML = `
    <div class="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative">
      <button id="product-modal-close" class="absolute top-4 right-4 text-gray-400 hover:text-gray-700" aria-label="Close">
        <i class="fa-solid fa-xmark text-xl"></i>
      </button>

      <div class="flex items-start gap-4 mb-4 pr-8">
        ${
          product.image
            ? `<img src="${product.image}" class="w-20 h-20 rounded-lg object-contain bg-gray-100 shrink-0" alt="${escapeHtml(product.name)}" />`
            : `<div class="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center shrink-0"><i class="fa-solid fa-box-open text-2xl text-gray-300"></i></div>`
        }
        <div>
          <p class="text-sm text-emerald-600 font-semibold">${escapeHtml(product.brand || "Unknown Brand")}</p>
          <h2 class="text-lg font-bold text-gray-900 leading-snug">${escapeHtml(product.name || "Unknown Product")}</h2>
          <p class="text-sm text-gray-500">${Math.round(n.calories || 0)} kcal/100g</p>
        </div>
      </div>

      <div class="flex flex-wrap gap-3 mb-4">
        ${
          grade !== "unknown"
            ? `<div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
                <span class="w-8 h-8 rounded ${scoreColor} text-white font-bold flex items-center justify-center uppercase shrink-0">${grade}</span>
                <div><p class="text-xs font-semibold text-gray-700">Nutri-Score</p><p class="text-xs text-gray-500">${NUTRI_SCORE_LABELS[grade] || ""}</p></div>
              </div>`
            : ""
        }
        ${
          product.novaGroup
            ? `<div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
                <span class="w-8 h-8 rounded-full bg-red-500 text-white font-bold flex items-center justify-center shrink-0">${product.novaGroup}</span>
                <div><p class="text-xs font-semibold text-gray-700">NOVA</p><p class="text-xs text-gray-500">${NOVA_LABELS[product.novaGroup] || ""}</p></div>
              </div>`
            : ""
        }
      </div>

      <div class="bg-emerald-50 rounded-xl p-4 mb-4">
        <p class="text-xs font-semibold text-gray-700 mb-3"><i class="fa-solid fa-chart-pie mr-1 text-emerald-600"></i>Nutrition Facts (per 100g)</p>
        <div class="text-center mb-4">
          <p class="text-4xl font-bold text-emerald-600">${Math.round(n.calories || 0)}</p>
          <p class="text-xs text-gray-500">Calories</p>
        </div>
        <div class="grid grid-cols-4 gap-2 text-center mb-3">
          <div><p class="font-bold text-emerald-700">${num(n.protein)}g</p><p class="text-[10px] text-gray-500">Protein</p></div>
          <div><p class="font-bold text-blue-700">${num(n.carbs)}g</p><p class="text-[10px] text-gray-500">Carbs</p></div>
          <div><p class="font-bold text-purple-700">${num(n.fat)}g</p><p class="text-[10px] text-gray-500">Fat</p></div>
          <div><p class="font-bold text-orange-700">${num(n.sugar)}g</p><p class="text-[10px] text-gray-500">Sugar</p></div>
        </div>
        <div class="grid grid-cols-3 gap-2 text-center text-xs text-gray-500 pt-3 border-t border-emerald-100">
          <div><p class="font-semibold text-gray-700">${n.saturatedFat != null ? num(n.saturatedFat) + "g" : "—"}</p>Saturated Fat</div>
          <div><p class="font-semibold text-gray-700">${n.fiber != null ? num(n.fiber) + "g" : "—"}</p>Fiber</div>
          <div><p class="font-semibold text-gray-700">${saltGrams != null ? saltGrams + "g" : "—"}</p>Salt</div>
        </div>
      </div>

      <div id="product-modal-ingredients"></div>

      <div class="flex gap-3">
        <button id="product-modal-log" class="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all">
          <i class="fa-solid fa-plus mr-1"></i>Log This Food
        </button>
        <button id="product-modal-close-btn" class="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all">Close</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  overlay.querySelector("#product-modal-close").addEventListener("click", close);
  overlay.querySelector("#product-modal-close-btn").addEventListener("click", close);
  overlay.querySelector("#product-modal-log").addEventListener("click", () => {
    close();
    onLog();
  });

  if (ingredientsPromise) {
    ingredientsPromise.then((text) => {
      // The modal may have been closed already while this was in flight.
      if (!text || !document.body.contains(overlay)) return;
      // Open Food Facts is crowd-sourced — some products have a nutrition
      // table (or other junk) pasted into the ingredients field by mistake.
      // Skip anything that clearly isn't a real ingredients list.
      const looksLikeNutritionTable = /kcal|valeurs|nutritional value/i.test(text) && text.length > 150;
      if (looksLikeNutritionTable) return;
      const slot = overlay.querySelector("#product-modal-ingredients");
      if (slot) {
        slot.innerHTML = `
          <div class="bg-gray-50 rounded-xl p-4 mb-4">
            <p class="text-xs font-semibold text-gray-700 mb-2"><i class="fa-solid fa-list mr-1"></i>Ingredients</p>
            <p class="text-sm text-gray-600">${escapeHtml(text)}</p>
          </div>`;
      }
    });
  }
}

export function closeProductModal() {
  document.getElementById("product-modal-overlay")?.remove();
}


export function showLogConfirmModal({ name, image, nutrition, itemType = "meal", unitLabel = "Number of Servings", onConfirm }) {
  closeLogConfirmModal();

  const isMeal = itemType === "meal";
  const accent = isMeal ? "blue" : "emerald";

  const overlay = document.createElement("div");
  overlay.id = "log-confirm-overlay";
  overlay.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5";
  overlay.innerHTML = `
    <div class="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
      <div class="flex items-center gap-3 p-5 border-b border-gray-100">
        ${
          image
            ? `<img src="${image}" alt="${escapeHtml(name)}" class="w-16 h-16 rounded-xl object-cover shrink-0" />`
            : `<div class="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center shrink-0"><i class="fa-solid fa-utensils text-xl text-gray-300"></i></div>`
        }
        <div class="min-w-0">
          <p class="text-xs font-semibold text-${accent}-600 uppercase tracking-wide mb-1">Add to Food Log</p>
          <h2 class="text-xl font-bold text-gray-900">Log This ${isMeal ? "Meal" : "Food"}</h2>
          <p class="text-sm text-gray-500 mt-0.5 truncate">${escapeHtml(name)}</p>
        </div>
        <button id="log-confirm-close" type="button" class="ml-auto w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0" title="Close">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="p-5">
        <div class="mb-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-gray-900">${escapeHtml(unitLabel)}</h3>
            <span class="text-xs text-gray-400">Adjust quantity</span>
          </div>
          <div class="flex items-center justify-center gap-3 mb-2">
            <button id="log-confirm-minus" type="button" class="w-10 h-10 rounded-lg bg-gray-100 text-xl text-gray-600 hover:bg-gray-200 transition-colors">−</button>
            <div id="log-confirm-count" class="w-20 h-10 border-2 border-gray-200 rounded-lg flex items-center justify-center text-lg font-bold text-gray-900">1</div>
            <button id="log-confirm-plus" type="button" class="w-10 h-10 rounded-lg bg-gray-100 text-xl text-gray-600 hover:bg-gray-200 transition-colors">+</button>
          </div>
        </div>

        <div class="bg-emerald-50 border border-green-200 rounded-xl p-4 mb-5">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
              <i class="fa-solid fa-chart-pie text-emerald-600 text-sm"></i>
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-800">Nutrition Preview</p>
              <p class="text-xs text-gray-500">Estimated per serving</p>
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div class="bg-white rounded-lg p-3 text-center">
              <p class="text-lg font-bold text-emerald-600">${Math.round(nutrition.calories)}</p>
              <p class="text-xs text-gray-500 mt-0.5">Calories</p>
            </div>
            <div class="bg-white rounded-lg p-3 text-center">
              <p class="text-lg font-bold text-blue-600">${Math.round(nutrition.protein)}g</p>
              <p class="text-xs text-gray-500 mt-0.5">Protein</p>
            </div>
            <div class="bg-white rounded-lg p-3 text-center">
              <p class="text-lg font-bold text-orange-500">${Math.round(nutrition.carbs)}g</p>
              <p class="text-xs text-gray-500 mt-0.5">Carbs</p>
            </div>
            <div class="bg-white rounded-lg p-3 text-center">
              <p class="text-lg font-bold text-purple-600">${Math.round(nutrition.fat)}g</p>
              <p class="text-xs text-gray-500 mt-0.5">Fat</p>
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-3">
          <button id="log-confirm-cancel" type="button" class="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all">Cancel</button>
          <button id="log-confirm-submit" type="button" class="flex-1 px-4 py-3 bg-${accent}-600 text-white rounded-xl text-sm font-semibold hover:bg-${accent}-700 transition-all">
            <i class="fa-solid fa-clipboard-list mr-2"></i>Log ${isMeal ? "Meal" : "Food"}
          </button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  const countEl = overlay.querySelector("#log-confirm-count");
  const clamp = (v) => Math.min(20, Math.max(1, v));
  let servings = 1;

  overlay.querySelector("#log-confirm-minus").addEventListener("click", () => {
    servings = clamp(servings - 1);
    countEl.textContent = servings;
  });
  overlay.querySelector("#log-confirm-plus").addEventListener("click", () => {
    servings = clamp(servings + 1);
    countEl.textContent = servings;
  });

  const close = () => overlay.remove();
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  overlay.querySelector("#log-confirm-close").addEventListener("click", close);
  overlay.querySelector("#log-confirm-cancel").addEventListener("click", close);
  overlay.querySelector("#log-confirm-submit").addEventListener("click", () => {
    close();
    onConfirm(servings);
  });
}

export function closeLogConfirmModal() {
  document.getElementById("log-confirm-overlay")?.remove();
}

/* ------------------------------------------------------------------ */
/* Food Log page                                                       */
/* ------------------------------------------------------------------ */

const ENTRY_ICONS = { meal: "fa-utensils", product: "fa-barcode", custom: "fa-pencil" };

function foodLogItemTemplate(entry) {
  return `
    <div class="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
      ${
        entry.image
          ? `<img src="${entry.image}" class="w-12 h-12 rounded-lg object-cover shrink-0" alt="${escapeHtml(entry.name)}" />`
          : `<div class="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0"><i class="fa-solid ${ENTRY_ICONS[entry.type] || "fa-utensils"} text-emerald-600"></i></div>`
      }
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-gray-900 truncate">${escapeHtml(entry.name)}</p>
        <p class="text-xs text-gray-500">${Math.round(entry.calories)} kcal &bull; P ${Math.round(entry.protein)}g &bull; C ${Math.round(
    entry.carbs
  )}g &bull; F ${Math.round(entry.fat)}g</p>
      </div>
      <button class="remove-entry-btn text-gray-400 hover:text-red-500 transition-colors px-2" data-entry-id="${entry.id}" title="Remove">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>`;
}

export function renderFoodLogItems(container, entries) {
  if (!container) return;
  if (!entries.length) {
    
    container.innerHTML = `
      <div class="text-center py-12 empty-state">
        <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fa-solid fa-utensils text-3xl text-gray-300"></i>
        </div>
        <p class="text-gray-500 font-medium mb-2">No food logged today</p>
        <p class="text-gray-400 text-sm mb-4">Start tracking your nutrition by logging meals or scanning products</p>
        <div class="flex justify-center gap-3">
          <a href="#meals" class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all">
            <i class="fa-solid fa-plus"></i>
            Browse Recipes
          </a>
          <a href="#products" class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
            <i class="fa-solid fa-barcode"></i>
            Scan Product
          </a>
        </div>
      </div>`;
    return;
  }
  container.innerHTML = entries
    .slice()
    .reverse()
    .map(foodLogItemTemplate)
    .join("");
}

/** Updates one of the 4 "Today's Nutrition" progress cards in place. */
export function updateProgressCard(cardEl, current, target, unit) {
  if (!cardEl) return;
  const valueSpan = cardEl.querySelector(".flex.items-center.justify-between span:last-child");
  if (valueSpan) valueSpan.textContent = `${Math.round(current)} / ${target} ${unit}`;
  const fill = cardEl.querySelector(".w-full.bg-gray-200 > div");
  if (fill) {
    const pct = Math.max(0, Math.min(100, (current / target) * 100));
    fill.style.width = `${pct}%`;
  }
}

// weekly overView
export function renderWeeklyOverview(container, weeklyData) {
  if (!container) return;
  const todayKey = toDateKey();

  container.innerHTML = `
    <div class="grid grid-cols-7 gap-2">
      ${weeklyData
        .map((d) => {
          const isToday = d.date === todayKey;
          const hasData = d.calories > 0;
          const dayNumber = Number(d.date.split("-")[2]);
          return `
          <div class="text-center ${isToday ? "bg-indigo-100 rounded-xl" : ""}">
            <p class="text-xs text-gray-500 mb-1">${d.label}</p>
            <p class="text-sm font-medium text-gray-900">${dayNumber}</p>
            <div class="mt-2 ${hasData ? "text-emerald-600" : "text-gray-300"}">
              <p class="text-lg font-bold">${Math.round(d.calories)}</p>
              <p class="text-xs">kcal</p>
            </div>
            ${hasData ? `<p class="text-xs text-gray-400 mt-1">${d.count} item${d.count === 1 ? "" : "s"}</p>` : ""}
          </div>`;
        })
        .join("")}
    </div>`;
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

const TOAST_STYLES = {
  success: { bg: "bg-emerald-600", icon: "fa-circle-check" },
  error: { bg: "bg-red-600", icon: "fa-circle-exclamation" },
  warning: { bg: "bg-amber-500", icon: "fa-triangle-exclamation" },
  info: { bg: "bg-blue-600", icon: "fa-circle-info" },
};


export function toast(message, icon = "success") {
  document.getElementById("app-toast")?.remove();

  const { bg, icon: iconClass } = TOAST_STYLES[icon] || TOAST_STYLES.success;
  const el = document.createElement("div");
  el.id = "app-toast";
  el.className = `notification-enter fixed top-6 right-6 z-[300] flex items-center gap-3 ${bg} text-white pl-4 pr-5 py-3.5 rounded-xl shadow-lg`;
  el.innerHTML = `<i class="fa-solid ${iconClass} text-lg"></i><span class="font-medium text-sm">${escapeHtml(message)}</span>`;
  document.body.appendChild(el);

  setTimeout(() => {
    el.style.transition = "opacity .3s ease, transform .3s ease";
    el.style.opacity = "0";
    el.style.transform = "translateY(-8px)";
    setTimeout(() => el.remove(), 300);
  }, 2500);
}

export function confirmDialog(title, text = "") {
  if (!window.Swal) return Promise.resolve(confirm(title));
  return Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#059669",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes",
  }).then((r) => r.isConfirmed);
}
