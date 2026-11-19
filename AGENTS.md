## Strict Project Constraints
- **Zero Build Pipeline:** You MUST NOT introduce `package.json`, `node_modules`, npm/yarn/pnpm, Webpack, Vite, Babel, or any frontend/UI frameworks (React, Vue, Svelte, Alpine).
- **Core Stack:** ONLY pure HTML5, CSS3, and Vanilla JavaScript (Native ES Modules) are permitted.

## Backend Rules (`functions/api/depremler.js`)
- **Cache Hit Target:** You MUST apply `setSeconds(0, 0)` to the current date when constructing the upstream AFAD API request to guarantee the URL remains perfectly static for 60 seconds.
- **Edge Headers:** The Cloudflare Function response MUST return `Cache-Control: public, max-age=60`.
- **Data Blindness Prevention:** The upstream request MUST strictly use `limit=2000` and `orderby=timedesc` to fetch 7 days of data, ensuring the API survives massive aftershock swarms without losing recent events.

## Frontend Rules (`public/modules/`)
- **Architecture & Modularity:**
  - `main.js` (Root): Orchestration only.
  - `state.js`: Central state definition.
  - `utils.js`: Pure functions and math calculations.
  - `api.js`: Network request logic.
  - `ui.js`: DOM manipulations.
  - `map.js`: Leaflet map interactions.
- **XSS Prevention:** Every single string property arriving from the API MUST pass through `escapeHTML` (from `utils.js`) before insertion into the DOM. No exceptions.
- **DOM Thrashing Prevention:** Bulk DOM insertions MUST be batched using `DocumentFragment`.
- **Map Render Cycle:** Map initialization and resizing within `<dialog>` modals (handled in `ui.js`) MUST be wrapped in a 250ms `setTimeout` to yield the main thread and prevent the UI from dropping frames during the CSS opening animation.