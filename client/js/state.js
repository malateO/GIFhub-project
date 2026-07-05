// Centralized shared state for GIFHub

export let lastDisplayedGifs = [];
export let currentSearchQuery = "";
export let favoritesSearchActive = false;

// Utility setters so other modules can update state safely
export function setLastDisplayedGifs(gifs) {
  lastDisplayedGifs = gifs;
}

export function setCurrentSearchQuery(query) {
  currentSearchQuery = query;
}

export function setFavoritesSearchActive(active) {
  favoritesSearchActive = active;
}
