/**
 * router.js
 */
export default class Router {
  constructor(onRouteChange) {
    this.onRouteChange = onRouteChange;
    window.addEventListener("hashchange", () => this._handle());
  }

  /** Parse the current location.hash and fire the very first render. */
  start() {
    this._handle();
  }

  /** Navigate to a new route */
  navigate(hash) {
    if (location.hash === `#${hash}`) {
      this._handle(); // hash unchanged — re-render anyway
    } else {
      location.hash = hash;
    }
  }

  _handle() {
    const raw = location.hash.replace(/^#/, "") || "meals";
    const [page, param] = raw.split("/");
    this.onRouteChange({ page, param });
  }
}
