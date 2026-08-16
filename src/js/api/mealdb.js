/**
 * mealdb.js
*/

const BASE_URL = "https://nutriplan-api.vercel.app/api/meals";

// Small icon map used by the UI layer when rendering category tiles.
const CATEGORY_ICONS = {
  Beef: "fa-drumstick-bite",
  Chicken: "fa-drumstick-bite",
  Dessert: "fa-ice-cream",
  Lamb: "fa-drumstick-bite",
  Miscellaneous: "fa-utensils",
  Pasta: "fa-bowl-food",
  Pork: "fa-bacon",
  Seafood: "fa-fish",
  Side: "fa-utensils",
  Starter: "fa-utensils",
  Vegan: "fa-seedling",
  Vegetarian: "fa-leaf",
  Breakfast: "fa-egg",
  Goat: "fa-drumstick-bite",
};

export default class MealDbAPI {
  static getCategoryIcon(name) {
    return CATEGORY_ICONS[name] || "fa-utensils";
  }

  static async _get(path, params = {}) {
    const query = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    const url = `${BASE_URL}${path}${query ? `?${query}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`NutriPlan meals request failed: ${res.status}`);
    return res.json();
  }

  /** Random meals — used to seed the ~25 meal homepage feed. */
  static async getRandomMeals(count = 25) {
    const data = await this._get("/random", { count });
    return data.results || [];
  }

  /** Search meals by name. */
  static async searchMealsByName(query, page = 1, limit = 25) {
    const data = await this._get("/search", { q: query, page, limit });
    return { results: data.results || [], pagination: data.pagination };
  }

  
  // Filter meals — category / area / ingredient can be combined
  static async filterMeals({ category, area, ingredient } = {}, page = 1, limit = 25) {
    const data = await this._get("/filter", { category, area, ingredient, page, limit });
    return { results: data.results || [], pagination: data.pagination };
  }

  /** Full details for a single meal by id. */
  static async getMealById(id) {
    const data = await this._get(`/${encodeURIComponent(id)}`);
    return data.result || null;
  }

  /** All meal categories (id, name, thumbnail, description). */
  static async getCategories() {
    const data = await this._get("/categories");
    return data.results || [];
  }

  /** All cuisine areas, e.g. Egyptian, Italian, Moroccan... */
  static async getAreas() {
    const data = await this._get("/areas");
    return (data.results || []).map((a) => a.name);
  }

  /** Convert a YouTube "watch" URL into an embeddable iframe URL. */
  static toEmbedUrl(youtubeUrl) {
    if (!youtubeUrl) return "";
    const videoId = youtubeUrl.split("v=")[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  }
}
