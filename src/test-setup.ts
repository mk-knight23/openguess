import "@testing-library/jest-dom/vitest";
// Node's experimental storage must not shadow the simulated browser's storage.
Object.defineProperty(globalThis, "localStorage", {
  value: window.localStorage,
  configurable: true,
});
