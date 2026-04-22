const API_KEY = "HWjUB90d31Rn3R81AZn7AEIsGSnjEYCr";

// 2. Fetching
async function fetchGifs(query) {
  const endpoint = query
    ? `https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=pg-13`
    : `https://api.giphy.com/v1/gifs/trending?api_key=${API_KEY}&limit=20&rating=pg-13`;

  const response = await fetch(endpoint);
  return response.json();
}

async function handleSearch(event) {
  const query = event.target.value.trim();
  const spinner = document.getElementById("loadingSpinner");
  if (spinner) spinner.style.display = "block";

  try {
    const data = await fetchGifs(query);
    return data.data;
  } catch (error) {
    console.error("Error fetching GIF's", error);
    return null;
  } finally {
    if (spinner) spinner.style.display = "none";
  }
}

async function fetchSuggestions(query) {
  const endpoint = `https://api.giphy.com/v1/tags/related/${encodeURIComponent(query)}?api_key=${API_KEY}`;
  const response = await fetch(endpoint);
  const data = await response.json();
  return data.data.map((item) => item.name);
}

function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}
