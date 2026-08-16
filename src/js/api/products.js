/**
 * products.js
 */

const BASE_URL = "https://nutriplan-api.vercel.app/api/products";

export const CATEGORY_LABEL_TO_ID = {
  snacks: "snacks",
  beverages: "beverages",
  breakfast: "breakfast-cereals",
  desserts: "desserts",
  dairy: "dairies",
  fruits: "fruits",
  vegetables: "vegetables",
};

export default class ProductsAPI {
  static async _get(path, params = {}) {
    const query = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    const url = `${BASE_URL}${path}${query ? `?${query}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`NutriPlan products request failed: ${res.status}`);
    return res.json();
  }

  /** Full-text search for products by name/brand. */
  static async searchByName(query, page = 1, limit = 24) {
    const data = await this._get("/search", { q: query, page, limit });
    return { results: data.results || [], pagination: data.pagination };
  }

  /** Look up a single product by its barcode / EAN / UPC. */
  static async getByBarcode(barcode) {
    try {
      const data = await this._get(`/barcode/${encodeURIComponent(barcode)}`);
      return data.result || null;
    } catch {
      return null; // barcode not found / request failed
    }
  }

  /** All product categories, e.g. { id: 'snacks', name: 'Snacks' }. */
  static async getCategories() {
    const data = await this._get("/categories");
    return data.results || [];
  }

  /** Browse products belonging to a category id (see CATEGORY_LABEL_TO_ID). */
  static async getByCategory(categoryId, page = 1, limit = 24) {
    const data = await this._get(`/category/${encodeURIComponent(categoryId)}`, { page, limit });
    return { results: data.results || [], pagination: data.pagination };
  }

  static async getIngredientsText(barcode) {
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=ingredients_text_en,ingredients_text`
      );
      if (!res.ok) return "";
      const data = await res.json();
      const p = data.product || {};
      return (p.ingredients_text_en || p.ingredients_text || "").trim();
    } catch {
      return "";
    }
  }
}
