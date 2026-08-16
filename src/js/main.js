/**
 * main.js
*/
import MealDbAPI from "./api/mealdb.js";
import ProductsAPI, { CATEGORY_LABEL_TO_ID } from "./api/products.js";
import NutritionAPI from "./api/nutrition.js";
import FoodLogService, { DAILY_TARGETS } from "./state/foodLog.js";
import AppState from "./state/appState.js";
import Router from "./router.js";
import {
  hideLoadingOverlay,
  renderSkeletonCards,
  renderCategories,
  renderAreaPills,
  renderMealCards,
  renderMealDetail,
  renderProductCards,
  showProductModal,
  showLogConfirmModal,
  renderFoodLogItems,
  updateProgressCard,
  renderWeeklyOverview,
  toast,
  confirmDialog,
} from "./ui/components.js";
import { debounce, capitalize, formatDateLong, generateMealNutrition } from "./utils/helpers.js";

const PAGE_SECTIONS = {
  meals: ["search-filters-section", "meal-categories-section", "all-recipes-section"],
  "meal-detail": ["meal-details"],
  products: ["products-section"],
  foodlog: ["foodlog-section"],
};

const PAGE_META = {
  meals: { title: "Meals & Recipes", subtitle: "Discover delicious and nutritious recipes tailored for you" },
  "meal-detail": { title: "Recipe Details", subtitle: "Everything you need to prepare this dish" },
  products: { title: "Product Scanner", subtitle: "Search packaged foods or scan a barcode for nutrition facts" },
  foodlog: { title: "Daily Food Log", subtitle: "Track and monitor your daily nutrition intake" },
};

const NAV_ROUTES = ["meals", "products", "foodlog"];
const ACTIVE_NAV_INDEX = { meals: 0, "meal-detail": 0, products: 1, foodlog: 2 };

class App {
  constructor() {
    this.state = new AppState();
    this.foodLog = new FoodLogService();
    this.router = null;

    window.NutriPlan = { setUsdaKey: (key) => NutritionAPI.setStoredApiKey(key) };
  }

  /* ------------------------------------------------------------ */
  /* Boot                                                           */
  /* ------------------------------------------------------------ */

  async init() {
    this.bindSidebarEvents();
    this.bindMealsEvents();
    this.bindProductsEvents();
    this.bindFoodLogEvents();

    try {
      const [categories, areas, meals] = await Promise.all([
        MealDbAPI.getCategories(),
        MealDbAPI.getAreas(),
        MealDbAPI.getRandomMeals(25),
      ]);
      this.state.categories = categories;
      this.state.areas = areas;
      renderCategories(document.getElementById("categories-grid"), categories, this.state.activeCategory);
      renderAreaPills(document.querySelector("#search-filters-section .overflow-x-auto"), areas, this.state.activeArea);
      this.renderMeals(meals);
    } catch (err) {
      console.error(err);
      this.showMealsError();
    } finally {
      hideLoadingOverlay();
    }

    if (!NutritionAPI.getStoredApiKey()) {
      console.info(
        "%cNutriPlan tip:%c want real USDA nutrition data on recipe pages instead of estimates? " +
          "Get a free key at https://fdc.nal.usda.gov/api-key-signup.html then run NutriPlan.setUsdaKey('YOUR_KEY') in this console.",
        "font-weight:bold;color:#059669;",
        "color:inherit;"
      );
    }

    this.router = new Router((route) => this.handleRoute(route));
    this.router.start();
  }

  /* ------------------------------------------------------------ */
  /* Routing / navigation                                          */
  /* ------------------------------------------------------------ */

  async handleRoute({ page, param }) {
    if (page === "meal" && param) {
      this.showPage("meal-detail");
      await this.openMealDetail(param);
    } else if (["meals", "products", "foodlog"].includes(page)) {
      this.showPage(page);
    } else {
      this.showPage("meals");
    }
  }

  showPage(page) {
    Object.values(PAGE_SECTIONS)
      .flat()
      .forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
      });

    (PAGE_SECTIONS[page] || PAGE_SECTIONS.meals).forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.display = "";
    });

    const meta = PAGE_META[page] || PAGE_META.meals;
    const headerTitle = document.querySelector("#header h1");
    const headerSubtitle = document.querySelector("#header p");
    if (headerTitle) headerTitle.textContent = meta.title;
    if (headerSubtitle) headerSubtitle.textContent = meta.subtitle;

    const activeIndex = ACTIVE_NAV_INDEX[page] ?? 0;
    document.querySelectorAll("#sidebar .nav-link").forEach((link, i) => {
      const isActive = i === activeIndex;
      link.classList.toggle("bg-emerald-50", isActive);
      link.classList.toggle("text-emerald-700", isActive);
      link.classList.toggle("text-gray-600", !isActive);
      const span = link.querySelector("span");
      if (span) {
        span.classList.toggle("font-semibold", isActive);
        span.classList.toggle("font-medium", !isActive);
      }
    });

    this.state.currentPage = page;
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (page === "foodlog") this.refreshFoodLogUI();
  }

  /* ------------------------------------------------------------ */
  /* Sidebar / navigation events                                   */
  /* ------------------------------------------------------------ */

  bindSidebarEvents() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    const openBtn = document.getElementById("header-menu-btn");
    const closeBtn = document.getElementById("sidebar-close-btn");

    const openSidebar = () => {
      sidebar?.classList.add("open");
      overlay?.classList.add("active");
    };
    const closeSidebar = () => {
      sidebar?.classList.remove("open");
      overlay?.classList.remove("active");
    };

    openBtn?.addEventListener("click", openSidebar);
    closeBtn?.addEventListener("click", closeSidebar);
    overlay?.addEventListener("click", closeSidebar);

    document.querySelectorAll("#sidebar .nav-link").forEach((link, i) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        this.router.navigate(NAV_ROUTES[i]);
        closeSidebar();
      });
    });
  }

  /* ------------------------------------------------------------ */
  /* Meals & Recipes page                                          */
  /* ------------------------------------------------------------ */

  bindMealsEvents() {
    const searchInput = document.getElementById("search-input");
    searchInput?.addEventListener("input", debounce((e) => this.handleSearch(e.target.value), 450));

    document.querySelector("#search-filters-section .overflow-x-auto")?.addEventListener("click", (e) => {
      const pill = e.target.closest(".area-filter-btn");
      if (!pill) return;
      this.setAreaFilter(pill.dataset.area || null);
    });

    document.getElementById("categories-grid")?.addEventListener("click", (e) => {
      const card = e.target.closest(".category-card");
      if (card) this.toggleCategoryFilter(card.dataset.category);
    });

    document.getElementById("recipes-grid")?.addEventListener("click", (e) => {
      const card = e.target.closest(".recipe-card");
      if (card) this.router.navigate(`meal/${card.dataset.mealId}`);
    });

    document.getElementById("grid-view-btn")?.addEventListener("click", () => this.setRecipesView("grid"));
    document.getElementById("list-view-btn")?.addEventListener("click", () => this.setRecipesView("list"));

    document.getElementById("back-to-meals-btn")?.addEventListener("click", () => this.router.navigate("meals"));

    document.getElementById("log-meal-btn")?.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.mealId;
      if (!id) return;
      const current = this.state.currentMeal;
      const meal = String(current?.meal?.id) === String(id) ? current.meal : null;
      const nutrition = meal ? current.nutrition : generateMealNutrition(id);
      showLogConfirmModal({
        name: meal?.name || "Meal",
        image: meal?.thumbnail || "",
        nutrition,
        itemType: "meal",
        onConfirm: (servings) => this.logCurrentMeal(id, servings),
      });
    });

    document.getElementById("meal-details")?.addEventListener("change", (e) => {
      if (!e.target.classList.contains("ingredient-checkbox")) return;
      const label = e.target.nextElementSibling;
      if (label) {
        label.classList.toggle("line-through", e.target.checked);
        label.classList.toggle("text-gray-400", e.target.checked);
      }
    });
  }

  updateAreaActiveState(activeArea) {
    document.querySelectorAll("#search-filters-section .area-filter-btn").forEach((btn) => {
      const isActive = (btn.dataset.area || null) === (activeArea || null);
      btn.classList.toggle("bg-emerald-600", isActive);
      btn.classList.toggle("text-white", isActive);
      btn.classList.toggle("bg-gray-100", !isActive);
      btn.classList.toggle("text-gray-700", !isActive);
    });
  }

  updateCategoryActiveState(activeCategory) {
    renderCategories(document.getElementById("categories-grid"), this.state.categories, activeCategory);
  }

  setRecipesView(mode) {
    this.state.viewMode = mode;
    const grid = document.getElementById("recipes-grid");
    if (grid) {
      grid.classList.toggle("grid-cols-4", mode === "grid");
      grid.classList.toggle("grid-cols-2", mode === "list");
    }
    const gridBtn = document.getElementById("grid-view-btn");
    const listBtn = document.getElementById("list-view-btn");
    [gridBtn, listBtn].forEach((btn) => btn?.classList.remove("bg-white", "shadow-sm"));
    (mode === "grid" ? gridBtn : listBtn)?.classList.add("bg-white", "shadow-sm");
  }

  renderMeals(meals, countLabel) {
    const grid = document.getElementById("recipes-grid");
    const countEl = document.getElementById("recipes-count");
    if (countEl) {
      countEl.textContent = meals.length
        ? countLabel
          ? `${countLabel} — ${meals.length} recipes`
          : `Showing ${meals.length} recipes`
        : "No recipes found";
    }
    renderMealCards(grid, meals);
  }

  showMealsError() {
    const grid = document.getElementById("recipes-grid");
    if (grid) {
      grid.innerHTML = `<div class="col-span-full text-center py-12 text-gray-500">
        <i class="fa-solid fa-triangle-exclamation text-4xl mb-3 text-amber-400"></i>
        <p class="font-medium">Couldn't load recipes. Please check your connection and try again.</p>
      </div>`;
    }
  }

  async resetMealFilters() {
    this.state.resetMealFilters();
    const input = document.getElementById("search-input");
    if (input) input.value = "";
    this.updateAreaActiveState(null);
    this.updateCategoryActiveState(null);
    renderSkeletonCards(document.getElementById("recipes-grid"), 8);
    try {
      const meals = await MealDbAPI.getRandomMeals(25);
      this.renderMeals(meals);
    } catch {
      this.showMealsError();
    }
  }

  async applyMealFilters() {
    const { activeCategory, activeArea } = this.state;
    if (!activeCategory && !activeArea) {
      return this.resetMealFilters();
    }
    renderSkeletonCards(document.getElementById("recipes-grid"), 8);
    try {
      const { results } = await MealDbAPI.filterMeals({ category: activeCategory, area: activeArea });
      const label = [activeArea, activeCategory].filter(Boolean).map(capitalize).join(" · ");
      this.renderMeals(results, label);
    } catch {
      this.showMealsError();
    }
  }

  toggleCategoryFilter(category) {
    this.state.activeCategory = this.state.activeCategory === category ? null : category;
    this.state.searchQuery = "";
    const input = document.getElementById("search-input");
    if (input) input.value = "";
    this.updateCategoryActiveState(this.state.activeCategory);
    this.applyMealFilters();
  }

  setAreaFilter(area) {
    this.state.activeArea = area || null;
    this.state.searchQuery = "";
    const input = document.getElementById("search-input");
    if (input) input.value = "";
    this.updateAreaActiveState(this.state.activeArea);
    this.applyMealFilters();
  }

  async handleSearch(query) {
    this.state.searchQuery = query.trim();
    if (!this.state.searchQuery) {
      this.resetMealFilters();
      return;
    }
    this.state.activeCategory = null;
    this.state.activeArea = null;
    this.updateAreaActiveState(null);
    this.updateCategoryActiveState(null);
    renderSkeletonCards(document.getElementById("recipes-grid"), 8);
    try {
      const { results } = await MealDbAPI.searchMealsByName(this.state.searchQuery);
      this.renderMeals(results, `Results for "${this.state.searchQuery}"`);
    } catch {
      this.showMealsError();
    }
  }

  /* ------------------------------------------------------------ */
  /* Meal Details page                                             */
  /* ------------------------------------------------------------ */

  async openMealDetail(id) {
    try {
      const meal = await MealDbAPI.getMealById(id);
      if (!meal) {
        toast("Meal not found", "error");
        return;
      }
      const embedUrl = MealDbAPI.toEmbedUrl(meal.youtube);

      let nutrition = generateMealNutrition(meal.id);
      let source = "estimated";

      const apiKey = NutritionAPI.getStoredApiKey();
      if (apiKey) {
        try {
          const ingredientLines = (meal.ingredients || []).map((ing) => `${ing.measure} ${ing.ingredient}`.trim());
          const result = await NutritionAPI.analyzeRecipe(meal.name, ingredientLines, apiKey);
          const mapped = this.mapUsdaResult(result, nutrition.servings);
          if (mapped) {
            nutrition = mapped;
            source = "usda";
          }
        } catch (err) {
          console.warn(`USDA nutrition analysis unavailable (${err.code || "error"}): ${err.message}. Showing an estimate instead.`);
        }
      }

      this.state.currentMeal = { meal, nutrition };
      renderMealDetail(meal, nutrition, embedUrl, source);
    } catch (err) {
      console.error(err);
      toast("Failed to load recipe details", "error");
    }
  }

  mapUsdaResult(result, servings) {
    const src = result?.nutrition || result?.nutrients || result || {};
    const calories = src.calories ?? src.energy ?? src.kcal;
    if (calories == null) return null;
    return {
      calories: Math.round(calories),
      protein: Math.round(src.protein ?? 0),
      carbs: Math.round(src.carbs ?? src.carbohydrates ?? 0),
      fat: Math.round(src.fat ?? 0),
      fiber: Math.round(src.fiber ?? 0),
      sugar: Math.round(src.sugar ?? 0),
      vitaminA: Math.round(src.vitaminA ?? 0),
      vitaminC: Math.round(src.vitaminC ?? 0),
      calcium: Math.round(src.calcium ?? 0),
      iron: Math.round(src.iron ?? 0),
      servings,
      totalCalories: Math.round(calories) * servings,
    };
  }

  logCurrentMeal(id, servings = 1) {
    const current = this.state.currentMeal;
    const meal = String(current?.meal?.id) === String(id) ? current.meal : null;
    const nutrition = meal ? current.nutrition : generateMealNutrition(id);
    const name = meal?.name || "Meal";
    const image = meal?.thumbnail || "";

    this.foodLog.addEntry({
      type: "meal",
      refId: id,
      name,
      image,
      servings,
      calories: nutrition.calories * servings,
      protein: nutrition.protein * servings,
      carbs: nutrition.carbs * servings,
      fat: nutrition.fat * servings,
    });

    toast(`${name} logged to your Food Log 🎉`);
  }

  /* ------------------------------------------------------------ */
  /* Product Scanner page                                          */
  /* ------------------------------------------------------------ */

  bindProductsEvents() {
    document.getElementById("search-product-btn")?.addEventListener("click", () => {
      const q = document.getElementById("product-search-input")?.value.trim();
      if (q) this.searchProducts(q);
    });
    document.getElementById("product-search-input")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") document.getElementById("search-product-btn")?.click();
    });

    document.getElementById("lookup-barcode-btn")?.addEventListener("click", () => {
      const code = document.getElementById("barcode-input")?.value.trim();
      if (code) this.lookupBarcode(code);
    });
    document.getElementById("barcode-input")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") document.getElementById("lookup-barcode-btn")?.click();
    });

    document.querySelectorAll(".nutri-score-filter").forEach((btn) => {
      btn.addEventListener("click", () => this.filterProductsByGrade(btn.dataset.grade || "", btn));
    });

    document.querySelectorAll(".product-category-btn").forEach((btn) => {
      const label = btn.textContent.trim();
      btn.addEventListener("click", () => this.browseProductCategory(label));
    });

    document.getElementById("products-grid")?.addEventListener("click", (e) => {
      const card = e.target.closest(".product-card");
      if (!card) return;
      const product = this.state.products.find((p) => p.barcode === card.dataset.barcode);
      if (product) {
        showProductModal(product, () => this.openProductLogConfirm(product), ProductsAPI.getIngredientsText(product.barcode));
      }
    });
  }

  renderProducts(products) {
    const countEl = document.getElementById("products-count");
    if (countEl) countEl.textContent = products.length ? `${products.length} products found` : "No products found";
    renderProductCards(document.getElementById("products-grid"), products);
  }

  showProductsError() {
    const grid = document.getElementById("products-grid");
    if (grid) {
      grid.innerHTML = `<div class="col-span-full text-center py-12 text-gray-500">
        <i class="fa-solid fa-triangle-exclamation text-4xl mb-3 text-amber-400"></i>
        <p class="font-medium">Couldn't load products. Please check your connection and try again.</p>
      </div>`;
    }
  }

  async searchProducts(query) {
    renderSkeletonCards(document.getElementById("products-grid"), 8);
    try {
      const { results } = await ProductsAPI.searchByName(query);
      this.state.products = results;
      this.state.activeNutriGrade = "";
      document.querySelectorAll(".nutri-score-filter").forEach((b) => b.classList.remove("ring-2", "ring-gray-900"));
      this.renderProducts(results);
    } catch (err) {
      console.error(err);
      this.showProductsError();
    }
  }

  async lookupBarcode(code) {
    renderSkeletonCards(document.getElementById("products-grid"), 1);
    try {
      const product = await ProductsAPI.getByBarcode(code);
      if (!product) {
        toast("No product found for this barcode", "error");
        this.state.products = [];
        this.renderProducts([]);
        return;
      }
      this.state.products = [product];
      this.renderProducts([product]);
    } catch (err) {
      console.error(err);
      this.showProductsError();
    }
  }

  filterProductsByGrade(grade, btnEl) {
    this.state.activeNutriGrade = grade;
    document.querySelectorAll(".nutri-score-filter").forEach((b) => {
      b.classList.toggle("ring-2", b === btnEl);
      b.classList.toggle("ring-gray-900", b === btnEl);
    });
    const filtered = grade ? this.state.products.filter((p) => (p.nutritionGrade || "").toLowerCase() === grade) : this.state.products;
    renderProductCards(document.getElementById("products-grid"), filtered);
    const countEl = document.getElementById("products-count");
    if (countEl) countEl.textContent = `${filtered.length} products found`;
  }

  async browseProductCategory(label) {
    const categoryId = CATEGORY_LABEL_TO_ID[label.toLowerCase()] || label.toLowerCase();
    renderSkeletonCards(document.getElementById("products-grid"), 8);
    try {
      const { results } = await ProductsAPI.getByCategory(categoryId);
      this.state.products = results;
      this.state.activeNutriGrade = "";
      document.querySelectorAll(".nutri-score-filter").forEach((b) => b.classList.remove("ring-2", "ring-gray-900"));
      this.renderProducts(results);
    } catch (err) {
      console.error(err);
      this.showProductsError();
    }
  }

  openProductLogConfirm(product) {
    const n = product.nutrients || {};
    showLogConfirmModal({
      name: product.name,
      image: product.image,
      nutrition: { calories: n.calories || 0, protein: n.protein || 0, carbs: n.carbs || 0, fat: n.fat || 0 },
      itemType: "product",
      unitLabel: "Number of 100g Portions",
      onConfirm: (servings) => this.logProduct(product, servings),
    });
  }

  logProduct(product, servings = 1) {
    const n = product.nutrients || {};
    this.foodLog.addEntry({
      type: "product",
      refId: product.barcode,
      name: product.name,
      image: product.image,
      servings,
      calories: (n.calories || 0) * servings,
      protein: (n.protein || 0) * servings,
      carbs: (n.carbs || 0) * servings,
      fat: (n.fat || 0) * servings,
    });
    toast(`${product.name} logged to your Food Log 🎉`);
    this.refreshFoodLogUI();
  }

  /* ------------------------------------------------------------ */
  /* Food Log page                                                 */
  /* ------------------------------------------------------------ */

  bindFoodLogEvents() {
    document.getElementById("clear-foodlog")?.addEventListener("click", () => {
      const modal = document.createElement("div");

      modal.className =
        "fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4";

      modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">

          <div class="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <i class="fa-solid fa-triangle-exclamation text-red-500 text-2xl"></i>
          </div>

          <h3 class="text-xl font-bold text-gray-900 mb-2">
            Clear All Meals?
          </h3>

          <p class="text-gray-500 mb-6">
            Are you sure you want to delete all logged meals for today?
            This action cannot be undone.
          </p>

          <div class="flex gap-3">
            <button
              id="cancel-clear-foodlog"
              class="flex-1 px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              Cancel
            </button>

            <button
              id="confirm-clear-foodlog"
              class="flex-1 px-5 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition"
            >
              <i class="fa-solid fa-trash mr-2"></i>
              Delete All
            </button>
          </div>

        </div>
      `;

      document.body.appendChild(modal);

      document
        .getElementById("cancel-clear-foodlog")
        .addEventListener("click", () => {
          modal.remove();
        });

      document
        .getElementById("confirm-clear-foodlog")
        .addEventListener("click", () => {
          this.foodLog.clearDay();
          this.refreshFoodLogUI();
          toast("All logged items have been removed successfully");

          modal.remove();
        });
    });

    document.getElementById("logged-items-list")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".remove-entry-btn");
      if (!btn) return;
      this.foodLog.removeEntry(btn.dataset.entryId);
      this.refreshFoodLogUI();
      toast("Meal removed successfully 🗑️");
    });

    document.querySelectorAll(".quick-log-btn").forEach((btn, i) => {
      btn.addEventListener("click", () => {
        if (i === 0) this.router.navigate("meals");
        else if (i === 1) this.router.navigate("products");
        else this.openCustomEntryDialog();
      });
    });
  }

  refreshFoodLogUI() {
    const dateEl = document.getElementById("foodlog-date");
    if (dateEl) dateEl.textContent = formatDateLong();

    const totals = this.foodLog.getTotals();
    const cards = document.querySelectorAll("#foodlog-today-section .grid > div");
    const targetsInOrder = [
      { key: "calories", unit: "kcal", target: DAILY_TARGETS.calories },
      { key: "protein", unit: "g", target: DAILY_TARGETS.protein },
      { key: "carbs", unit: "g", target: DAILY_TARGETS.carbs },
      { key: "fat", unit: "g", target: DAILY_TARGETS.fat },
    ];
    cards.forEach((card, i) => {
      const t = targetsInOrder[i];
      if (t) updateProgressCard(card, totals[t.key], t.target, t.unit);
    });

    const entries = this.foodLog.getEntries();
    const listEl = document.getElementById("logged-items-list");
    const countEl = document.querySelector("#foodlog-today-section h4");
    if (countEl) countEl.textContent = `Logged Items (${entries.length})`;

    const clearBtn = document.getElementById("clear-foodlog");
    if (clearBtn) clearBtn.style.display = entries.length ? "" : "none";

    renderFoodLogItems(listEl, entries);
    renderWeeklyOverview(document.getElementById("weekly-chart"), this.foodLog.getWeeklyTotals());

    // Update Weekly Summary cards
    updateWeeklySummary(this.foodLog);
  }

  async openCustomEntryDialog() {
    if (!window.Swal) return;
    const { value } = await Swal.fire({
      title: "Add Custom Food Entry",
      html: `
        <input id="swal-name" class="swal2-input" placeholder="Food name">
        <input id="swal-cal" type="number" min="0" class="swal2-input" placeholder="Calories (kcal)">
        <input id="swal-protein" type="number" min="0" class="swal2-input" placeholder="Protein (g)">
        <input id="swal-carbs" type="number" min="0" class="swal2-input" placeholder="Carbs (g)">
        <input id="swal-fat" type="number" min="0" class="swal2-input" placeholder="Fat (g)">
      `,
      focusConfirm: false,
      confirmButtonColor: "#059669",
      confirmButtonText: "Add",
      showCancelButton: true,
      preConfirm: () => {
        const name = document.getElementById("swal-name").value.trim();
        if (!name) {
          Swal.showValidationMessage("Please enter a food name");
          return false;
        }
        return {
          name,
          calories: Number(document.getElementById("swal-cal").value) || 0,
          protein: Number(document.getElementById("swal-protein").value) || 0,
          carbs: Number(document.getElementById("swal-carbs").value) || 0,
          fat: Number(document.getElementById("swal-fat").value) || 0,
        };
      },
    });

    if (value) {
      this.foodLog.addEntry({ type: "custom", ...value });
      this.refreshFoodLogUI();
      toast(`${value.name} added to your Food Log 🎉`);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  app.init();
});


function updateWeeklySummary(foodLog) {
  const weeklyTotals = foodLog.getWeeklyTotals();

  // Weekly Average
  const totalWeeklyCalories = weeklyTotals.reduce(
    (sum, day) => sum + day.calories,
    0
  );

  const weeklyAverage = Math.round(totalWeeklyCalories / 7);

  document.getElementById(
    "weekly-average-calories"
  ).textContent = `${weeklyAverage} kcal`;

  // Total Items
  const totalWeeklyItems = weeklyTotals.reduce(
    (sum, day) => sum + day.count,
    0
  );

  document.getElementById(
    "weekly-total-items"
  ).textContent = `${totalWeeklyItems} ${
    totalWeeklyItems === 1 ? "item" : "items"
  }`;

  // Days On Goal
  const daysOnGoal = weeklyTotals.filter(
    (day) => day.calories >= DAILY_TARGETS.calories
  ).length;

  document.getElementById(
    "days-on-goal"
  ).textContent = `${daysOnGoal} / 7`;
}