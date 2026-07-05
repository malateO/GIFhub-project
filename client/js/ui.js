import { fetchGifs } from "./api.js";
import { userProfile, updateUI, showToast } from "./auth.js";
import { displayFavorites, toggleFavorite } from "./favorites.js";

export function initMasonry(containerId) {
  const container = document.getElementById(containerId);
  if (!container || typeof Masonry === "undefined") return;

  const existing = Masonry.data(container);
  if (existing) existing.destroy();

  const msnry = new Masonry(container, {
    itemSelector: ".gif-item",
    gutter: 8, // ✅ consistent spacing between items
    fitWidth: false, // ✅ fill container width
  });

  // ✅ Wait for images to load before layout
  if (typeof imagesLoaded !== "undefined") {
    imagesLoaded(container, () => {
      msnry.layout();
    });
  }

  return msnry;
}

function showHomePage() {
  hideAllSections();
  clearSearchState();

  const featureSection = document.getElementById("feature-section");
  if (featureSection) featureSection.style.display = "block";

  const searchBlock = document.querySelector(".search-block");
  if (searchBlock) searchBlock.style.display = "block";

  const mainHeader = document.querySelector(".hero");
  if (mainHeader) mainHeader.style.display = "block";

  fetchGifs("").then(async (data) => {
    const favorites = userProfile ? await getFavorites() : [];
    displayGifs(data.data, favorites, false, "");
  });
}

function showProfilePage() {
  hideAllSections();
  clearSearchState();

  const profileSection = document.getElementById("profile");
  if (profileSection) profileSection.style.display = "block";

  // ✅ Show search + header again
  const searchBlock = document.querySelector(".search-block");
  if (searchBlock) searchBlock.style.display = "block";

  const mainHeader = document.querySelector(".hero");
  if (mainHeader) mainHeader.style.display = "block";

  const resultsContainer = document.getElementById("profileSearchResults");
  if (resultsContainer) resultsContainer.style.display = "none";

  // ✅ Refresh profile image if userProfile has one
  const profileImg = document.getElementById("profileImage");
  if (profileImg && userProfile?.profileImage) {
    profileImg.src = userProfile.profileImage;
  }

  window.profileSearchState = { query: "", offset: 0, limit: 20 };
}

function showFavoritesPage() {
  hideAllSections();
  clearSearchState();

  const favoritesSection = document.getElementById("favorites");
  if (favoritesSection) favoritesSection.style.display = "block";

  // ✅ Show search + header again
  const searchBlock = document.querySelector(".search-block");
  if (searchBlock) searchBlock.style.display = "block";

  const mainHeader = document.querySelector(".hero");
  if (mainHeader) mainHeader.style.display = "block";

  if (typeof displayFavorites === "function") {
    displayFavorites("favoritesGrid", true);
  }
}

function showAboutPage() {
  hideAllSections();
  clearSearchState();

  const aboutSection = document.getElementById("about");
  if (aboutSection) aboutSection.style.display = "block";

  // ✅ Hide search bar + main header
  const searchBlock = document.querySelector(".search-block");
  if (searchBlock) searchBlock.style.display = "none";

  const mainHeader = document.querySelector(".hero");
  if (mainHeader) mainHeader.style.display = "none";
}

export async function getFavorites() {
  const token = localStorage.getItem("token");
  if (!token || !userProfile) {
    return []; // ✅ return empty array if logged out
  }

  try {
    const res = await fetch("http://localhost:5000/api/favorites", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        userProfile = null;
        updateUI();
      }
      return [];
    }
    const data = await res.json();
    return data.favorites || [];
  } catch (err) {
    console.error("getFavorites error", err);
    return [];
  }
}

export function displayGifs(gifs, favorites, isSearch = false, query = "") {
  const featureHeader = document.querySelector(".feature-header");

  if (featureHeader) {
    featureHeader.textContent = query
      ? `Search Results for ${query}`
      : "Feature GIFs";
  }

  const resultContainer = document.getElementById("gifResults");
  if (!resultContainer) return;

  // Clear previous results
  resultContainer.innerHTML = "";
  const loadMoreBtn = document.getElementById("loadMoreBtn");

  if (!gifs || gifs.length === 0) {
    if (loadMoreBtn) loadMoreBtn.style.display = "none";
    const message = document.createElement("div");
    message.className = "no-results";
    message.textContent = "No GIFs Found. Try Another Search!";
    resultContainer.appendChild(message);
    return;
  }

  // Render GIFs
  gifs.forEach((gif) => {
    const imgUrl =
      gif.images?.fixed_height?.url ||
      gif.images?.downsized?.url ||
      gif.images?.original?.url;

    if (!imgUrl) return;

    const gifWrapper = document.createElement("div");
    gifWrapper.className = "gif-item";

    const img = document.createElement("img");
    img.src = imgUrl;
    img.alt = gif.title || "GIF";

    if (userProfile) {
      const favButton = document.createElement("button");
      favButton.className = "fav-btn";

      const isFavorited = favorites.some((fav) => fav.id === gif.id);
      favButton.textContent = isFavorited ? "❤️" : "🤍";
      if (isFavorited) favButton.classList.add("active");

      favButton.addEventListener("click", async () => {
        await toggleFavorite(gif);

        // Flip the button instantly
        if (favButton.classList.contains("active")) {
          favButton.classList.remove("active");
          favButton.textContent = "🤍";
        } else {
          favButton.classList.add("active");
          favButton.textContent = "❤️";
        }
      });

      gifWrapper.appendChild(favButton);
    }

    gifWrapper.appendChild(img);
    resultContainer.appendChild(gifWrapper);
  });

  initMasonry("gifResults");
}

export async function displayProfileSearchResults(gifs, favorites, query = "") {
  lastDisplayedGifs = gifs;
  // reset state when new query
  if (query !== profileSearchState.query) {
    profileSearchState.query = query;
    profileSearchState.offset = 0;
  }

  const header = document.getElementById("profileFeatureHeader");
  if (header) {
    header.textContent = query ? `Search Results for ${query}` : "Profile GIFs";
  }

  const grid = document.getElementById("profileGifResults");
  const loadMoreBtn = document.getElementById("profileLoadMoreBtn");
  const spinner = document.getElementById("profileLoadingSpinner");
  const masonryTarget = document.getElementById("profileGifResults");

  if (!grid) return;

  // If offset is zero, replace content; otherwise we append
  if (profileSearchState.offset === 0) grid.innerHTML = "";

  // No results
  if (!gifs || gifs.length === 0) {
    if (profileSearchState.offset === 0) {
      grid.innerHTML = "";
      const message = document.createElement("div");
      message.className = "no-results";
      message.textContent = "No GIFs Found. Try Another Search!";
      grid.appendChild(message);
    }
    showToast("No more Profile results", "info"); // ✅ toast
    loadMoreBtn.style.display = "none";
    return;
  }

  // Render GIFs
  gifs.forEach((gif) => {
    const imgUrl =
      gif.images?.fixed_height?.url ||
      gif.images?.downsized?.url ||
      gif.images?.original?.url;
    if (!imgUrl) return;

    const gifWrapper = document.createElement("div");
    gifWrapper.className = "gif-item";

    const img = document.createElement("img");
    img.src = imgUrl;
    img.alt = gif.title || "GIF";

    // Favorite button (backend-aware)
    if (userProfile) {
      const favButton = document.createElement("button");
      favButton.className = "fav-btn";

      // ✅ Use backend favorites passed in
      const isFavorited = favorites.some((fav) => fav.id === gif.id);

      favButton.textContent = isFavorited ? "❤️" : "🤍";
      if (isFavorited) favButton.classList.add("active");

      favButton.addEventListener("click", () => toggleFavorite(gif));
      gifWrapper.appendChild(favButton);
    }

    gifWrapper.appendChild(img);
    grid.appendChild(gifWrapper);
  });

  // Show Load More if we got a full page
  if (gifs.length >= profileSearchState.limit) {
    loadMoreBtn.style.display = "block";
  } else {
    loadMoreBtn.style.display = "none";
  }

  // Wire Load More (idempotent)
  loadMoreBtn.onclick = async () => {
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = "Loading...";
    spinner.style.display = "block";

    try {
      profileSearchState.offset += profileSearchState.limit;
      const res = await fetchGifs(
        profileSearchState.query,
        profileSearchState.offset,
        profileSearchState.limit,
      );
      const newFavorites = await getFavorites(); // ✅ fetch backend favorites
      displayProfileSearchResults(
        res.data || [],
        newFavorites,
        profileSearchState.query,
      );
    } catch (err) {
      console.error("Profile Load More failed", err);
    } finally {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = "Load More GIFs";
      spinner.style.display = "none";
    }
  };

  // Masonry refresh if used
  initMasonry("profileGifResults");
}

export function hideAllSections() {
  const feature = document.getElementById("feature-section");
  const profile = document.getElementById("profile");
  const favorites = document.getElementById("favorites");
  const about = document.getElementById("about");

  if (feature) feature.style.display = "none";
  if (profile) profile.style.display = "none";
  if (favorites) favorites.style.display = "none";
  if (about) about.style.display = "none";

  // Clear containers to avoid overlap
  const profileGrid = document.getElementById("profileGifResults");
  if (profileGrid) profileGrid.innerHTML = "";
  const favoritesGrid = document.getElementById("favoritesGrid");
  if (favoritesGrid) favoritesGrid.innerHTML = "";
}

// --- Clear only DOM, not main.js state ---
function clearSearchState() {
  const searchBar = document.getElementById("searchBar");
  if (searchBar) searchBar.value = "";

  const profileResults = document.getElementById("profileSearchResults");
  if (profileResults) {
    profileResults.style.display = "none";
    profileResults.classList.remove("active");
  }

  const profileHeader = document.getElementById("profileFeatureHeader");
  if (profileHeader) profileHeader.textContent = "Profile GIFs";

  const favoritesHeader = document.getElementById("favoritesHeader");
  if (
    favoritesHeader &&
    document.getElementById("favorites").style.display !== "block"
  ) {
    favoritesHeader.textContent = "My Favorites";
  }

  const profileGrid = document.getElementById("profileGifResults");
  if (profileGrid) profileGrid.innerHTML = "";

  const favoritesGrid = document.getElementById("favoritesGrid");
  if (favoritesGrid) favoritesGrid.innerHTML = "";

  const gifResults = document.getElementById("gifResults");
  if (gifResults) gifResults.innerHTML = "";
}

async function displayFavoritesSearch(query, offset = 0, limit = 20) {
  const data = await fetchGifs(query, offset, limit);
  let favorites = [];
  if (userProfile) {
    favorites = await getFavorites();
  }

  const favoritesHeader = document.getElementById("favoritesHeader");
  if (favoritesHeader) {
    favoritesHeader.textContent = query
      ? `Search Results for ${query}`
      : "My Favorites";
  }

  const favoritesGrid = document.getElementById("favoritesGrid");
  if (favoritesGrid) {
    favoritesGrid.innerHTML = "";
    data.data.forEach((gif) => {
      const imgUrl =
        gif.images?.fixed_height?.url ||
        gif.images?.downsized?.url ||
        gif.images?.original?.url;

      if (!imgUrl) return; // skip broken GIFs

      const gifWrapper = document.createElement("div");
      gifWrapper.className = "gif-item";

      const img = document.createElement("img");
      img.src = imgUrl;
      img.alt = gif.title || "GIF";

      if (userProfile) {
        const favButton = document.createElement("button");
        favButton.className = "fav-btn";
        const isFavorited = favorites.some((fav) => fav.id === gif.id);
        favButton.textContent = isFavorited ? "❤️" : "🤍";
        if (isFavorited) favButton.classList.add("active");
        favButton.addEventListener("click", async () => {
          await toggleFavorite(gif);

          // Flip the button instantly
          if (favButton.classList.contains("active")) {
            favButton.classList.remove("active");
            favButton.textContent = "🤍";
          } else {
            favButton.classList.add("active");
            favButton.textContent = "❤️";
          }
        });

        gifWrapper.appendChild(favButton);
      }

      gifWrapper.appendChild(img);
      favoritesGrid.appendChild(gifWrapper);
    });

    initMasonry("favoritesGrid");
  }
}

export {
  showHomePage,
  showProfilePage,
  showFavoritesPage,
  showAboutPage,
  clearSearchState,
  displayFavoritesSearch,
};
