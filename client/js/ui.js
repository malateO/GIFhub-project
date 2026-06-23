function initMasonry(containerId) {
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

// function showHomePage() {
//   hideAllSections();
//   clearSearchState();
//   lastActiveSection = "home";
//   localStorage.setItem("lastActiveSection", lastActiveSection); // ✅ persist

//   const featureSection = document.getElementById("feature-section");
//   if (featureSection) featureSection.style.display = "block";

//   // ✅ reload trending GIFs immediately when navigating Home
//   fetchGifs("").then(async (data) => {
//     const favorites = userProfile ? await getFavorites() : [];
//     displayGifs(data.data, favorites, false, "");
//   });
// }

async function getFavorites() {
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

function displayGifs(gifs, favorites, isSearch = false, query = "") {
  lastDisplayedGifs = gifs;
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

      // ✅ Use favorites passed in as argument
      const isFavorited = favorites.some((fav) => fav.id === gif.id);

      favButton.textContent = isFavorited ? "❤️" : "🤍";
      if (isFavorited) favButton.classList.add("active");

      favButton.addEventListener("click", () => toggleFavorite(gif));
      gifWrapper.appendChild(favButton);
    }

    gifWrapper.appendChild(img);
    resultContainer.appendChild(gifWrapper);
  });

  // Masonry refresh if used
  initMasonry("gifResults");
}

async function displayProfileSearchResults(gifs, favorites, query = "") {
  lastDisplayedGifs = gifs;
  // reset state when new query
  if (query !== profileSearchState.query) {
    profileSearchState.query = query;
    profileSearchState.offset = 0;
  }

  const header = document.getElementById("profileFeatureHeader");
  if (header)
    header.textContent = query ? `Search Results for ${query}` : "Profile GIFs";

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

// Hide all sections first
function hideAllSections() {
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
