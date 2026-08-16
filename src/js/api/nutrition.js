/**
 * nutrition.js
*/

const BASE_URL = "https://nutriplan-api.vercel.app/api/nutrition";
const STORAGE_KEY = "nutriplan_usda_key";


export class NutritionError extends Error {
  constructor(code, message, ingredient) {
    super(message || "Nutrition analysis failed");
    this.name = "NutritionError";
    this.code = code || "UNKNOWN";
    this.ingredient = ingredient || null;
  }
}

export default class NutritionAPI {
  static getStoredApiKey() {
    return localStorage.getItem(STORAGE_KEY) || "";
  }

  static setStoredApiKey(key) {
    if (key) localStorage.setItem(STORAGE_KEY, key);
    else localStorage.removeItem(STORAGE_KEY);
  }

  //RECIPE
  static async analyzeRecipe(recipeName, ingredients, apiKey = this.getStoredApiKey()) {
    if (!apiKey) throw new NutritionError("NO_API_KEY", "No USDA API key configured");

    const res = await fetch(`${BASE_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ recipeName, ingredients }),
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      throw new NutritionError("BAD_RESPONSE", "Could not parse nutrition response");
    }

    if (!res.ok || data.success === false) {
      const err = data.error || {};
      throw new NutritionError(err.code, err.message, err.ingredient);
    }

    return data.result || data;
  }
}
