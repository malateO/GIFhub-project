// api.js (ES Module)

const API_KEY = "HWjUB90d31Rn3R81AZn7AEIsGSnjEYCr";

// Fetch GIFs (search or trending)
export async function fetchGifs(query = "", offset = 0, limit = 20) {
  const endpoint = query
    ? `https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${encodeURIComponent(
        query,
      )}&limit=${limit}&offset=${offset}&rating=pg-13`
    : `https://api.giphy.com/v1/gifs/trending?api_key=${API_KEY}&limit=${limit}&offset=${offset}&rating=pg-13`;

  const response = await fetch(endpoint);
  return response.json();
}

// Fetch related search suggestions
export async function fetchSuggestions(query) {
  const endpoint = `https://api.giphy.com/v1/tags/related/${encodeURIComponent(
    query,
  )}?api_key=${API_KEY}`;
  const response = await fetch(endpoint);
  const data = await response.json();
  return data.data.map((item) => item.name);
}

// Debounce helper
export function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}
