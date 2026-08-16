/**
 * appState.js
 */
export default class AppState {
  constructor() {
    this.currentPage = "meals"; // 'meals' | 'meal-detail' | 'products' | 'foodlog'

    // Meals & Recipes page
    this.categories = [];
    this.activeCategory = null;
    this.activeArea = null;
    this.searchQuery = "";
    this.viewMode = "grid"; // 'grid' | 'list'

    // Meal detail page
    this.currentMeal = null; // { meal, nutrition }

    // Product Scanner page
    this.products = [];
    this.activeNutriGrade = "";
  }

  /** Clear every active meals filter (used by the "All Recipes" pill / search reset). */
  resetMealFilters() {
    this.activeCategory = null;
    this.activeArea = null;
    this.searchQuery = "";
  }
}
