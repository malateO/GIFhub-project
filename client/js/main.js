let lastDisplayedGifs = [];
let infiniteScrollEnabled = false;
let currentSearchQuery = "";
let favoritesSearchActive = false;

const gifGallery = document.getElementById("gifGallery");
const searchBar = document.getElementById("searchBar");
const searchForm = document.querySelector(".search-form");
const spinner = document.getElementById("loadingSpinner");

const loadMoreBtn = document.getElementById("loadMoreBtn");

const popupOverlay = document.querySelector(".popup-overlay");
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const authPopup = document.getElementById("auth-popup");

async function loadMoreGifs(query) {
  try {
    const data = await fetchGifs(query);
    let favorites = [];
    if (userProfile) {
      // ✅ only fetch favorites if logged in
      favorites = await getFavorites();
    }
    displayGifs([...lastDisplayedGifs, ...data.data], favorites);
  } catch (error) {
    console.error("GIF fetch failed", error);
  } finally {
    spinner.style.display = "none";
  }
}

// add this near top of main.js
async function onGalleryScroll() {
  if (
    gifGallery.scrollTop + gifGallery.clientHeight >=
    gifGallery.scrollHeight - 200
  ) {
    const query = searchBar.value.trim();
    await loadMoreGifs(query);
  }
}

// when enabling infinite scroll:
gifGallery.addEventListener("scroll", onGalleryScroll);

// when disabling/resetting:
gifGallery.removeEventListener("scroll", onGalleryScroll);

// shared suggestions container (declare near other DOM refs)
const suggestionsContainer = document.getElementById("searchSuggestions");

// Reset to feature/trending GIFs immediately when the search box is cleared
searchBar.addEventListener(
  "input",
  debounce(async (e) => {
    const q = e.target.value.trim();

    // If not empty, do nothing here (suggestions handler already runs)
    if (q) return;

    // Clear suggestions if any
    if (suggestionsContainer) suggestionsContainer.innerHTML = "";

    // Hide profile search results (if visible)
    const resultsContainer = document.getElementById("profileSearchResults");
    if (resultsContainer) {
      resultsContainer.classList.remove("active");
      resultsContainer.style.display = "none";
      const profileGrid = document.getElementById("profileGifResults");
      if (profileGrid) profileGrid.innerHTML = "";
    }

    // Reset infinite scroll state so Load More behaves predictably
    infiniteScrollEnabled = false;
    gifGallery.removeEventListener("scroll", onGalleryScroll); // safe remove (see note)

    // Show spinner while fetching trending
    if (spinner) spinner.style.display = "block";

    try {
      const data = await fetchGifs("");
      // displayGifs expects (gifs, isSearch, query)
      const favorites = await getFavorites();
      displayGifs(data.data, favorites, false, "");
    } catch (err) {
      console.error("GIF fetch failed", err);
    } finally {
      if (spinner) spinner.style.display = "none";
    }
  }, 300),
);

// Clear suggestions immediately when Enter is pressed to avoid flash
searchBar.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault(); // prevent double-submit behavior
    if (suggestionsContainer) suggestionsContainer.innerHTML = "";
    searchForm.requestSubmit(); //trigger submit right away
  }
});

// debounced input handler for suggestions
searchBar.addEventListener(
  "input",
  debounce(async (event) => {
    const query = event.target.value.trim();
    if (!suggestionsContainer) return;
    suggestionsContainer.innerHTML = "";

    if (!query) {
      favoritesSearchActive = false; // ✅ reset when query is cleared
      // ✅ Restore Profile dashboard when search is cleared
      if (userProfile && userProfile.username) {
        const profileHeader = document.querySelector(".profile-header");
        const profileDashboardText = document.getElementById(
          "profileDashboardText",
        );
        const profileSubheader = document.querySelector(".profile-subheader");
        const resultsContainer = document.getElementById(
          "profileSearchResults",
        );

        if (profileHeader) profileHeader.style.display = "flex";
        if (profileDashboardText) profileDashboardText.style.display = "block";
        if (profileSubheader) profileSubheader.style.display = "block";
        if (resultsContainer) resultsContainer.style.display = "none";
      }

      return; // stop here, don’t fetch suggestions
    }

    try {
      const suggestions = await fetchSuggestions(query);
      suggestions.forEach((s) => {
        const suggestionItem = document.createElement("div");
        suggestionItem.className = "suggestion-item";
        suggestionItem.textContent = s;

        suggestionItem.addEventListener("click", () => {
          searchBar.value = s;
          suggestionsContainer.innerHTML = "";
          searchForm.requestSubmit();
        });

        suggestionsContainer.appendChild(suggestionItem);
      });
    } catch (err) {
      console.error("Suggestion fetch failed", err);
    }
  }, 500),
);

window.addEventListener("keydown", (e) => {
  console.log("key pressed", e.key);
  if (authPopup.classList.contains("show")) {
    // Escapes closes modal
    if (e.key === "Escape") {
      closeModal();
    }
    // Enters submits active form
    if (e.key === "Enter") {
      if (!loginForm.classList.contains("hidden")) {
        loginForm.requestSubmit();
      } else if (!signupForm.classList.contains("hidden")) {
        signupForm.requestSubmit();
      }
    }
    // Tab Focus Trap
    if (e.key === "Tab") {
      const focusable = authPopup.querySelectorAll("input, button, .close-btn");
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
});

authPopup.addEventListener("click", (e) => {
  if (e.target === authPopup) {
    closeModal();
  }
});

loadMoreBtn.addEventListener("click", async () => {
  const query = searchBar.value.trim();
  await loadMoreGifs(query);
  loadMoreBtn.style.display = "none";

  if (!infiniteScrollEnabled) {
    infiniteScrollEnabled = true;
    gifGallery.addEventListener("scroll", async () => {
      if (
        gifGallery.scrollTop + gifGallery.clientHeight >=
        gifGallery.scrollHeight - 200
      ) {
        const query = searchBar.value.trim();
        await loadMoreGifs(query);
      }
    });
  }
});

// Initial load of trending GIFs
fetchGifs("").then(async (data) => {
  let favorites = [];
  if (userProfile) {
    // ✅ only if logged in
    favorites = await getFavorites();
  }
  displayGifs(data.data, favorites, false, "");
});

// Search form submit handler
searchForm.addEventListener("submit", async (e) => {
  if (document.getElementById("favorites").style.display === "block") {
    e.preventDefault();
    if (suggestionsContainer) suggestionsContainer.innerHTML = "";
    searchBar.blur();

    currentSearchQuery = searchBar.value.trim();
    favoritesSearchActive = true; // ✅ mark that we’re in Favorites search mode
    const data = await fetchGifs(currentSearchQuery);

    // ✅ Only fetch favorites if logged in
    let favorites = [];
    if (userProfile) {
      favorites = await getFavorites();
    }

    // ✅ Show search results inside Favorites grid
    const favoritesGrid = document.getElementById("favoritesGrid");
    if (favoritesGrid) {
      favoritesGrid.innerHTML = ""; // clear old favorites
      data.data.forEach((gif) => {
        const gifWrapper = document.createElement("div");
        gifWrapper.className = "gif-item";

        const img = document.createElement("img");
        img.src =
          gif.images?.fixed_height?.url ||
          gif.images?.downsized?.url ||
          gif.images?.original?.url;
        img.alt = gif.title || "GIF";

        // Favorite button
        if (userProfile) {
          const favButton = document.createElement("button");
          favButton.className = "fav-btn";
          const isFavorited = favorites.some((fav) => fav.id === gif.id);
          favButton.textContent = isFavorited ? "❤️" : "🤍";
          if (isFavorited) favButton.classList.add("active");
          favButton.addEventListener("click", () => toggleFavorite(gif));
          gifWrapper.appendChild(favButton);
        }

        gifWrapper.appendChild(img);
        favoritesGrid.appendChild(gifWrapper);
      });

      initMasonry("favoritesGrid");
    }
    return;
  }

  if (suggestionsContainer) suggestionsContainer.innerHTML = "";
  searchBar.blur();

  currentSearchQuery = searchBar.value.trim();
  const data = await fetchGifs(currentSearchQuery);

  // ✅ Only fetch favorites if logged in
  let favorites = [];
  if (userProfile) {
    favorites = await getFavorites();
  }

  if (userProfile && userProfile.username) {
    const profileGallery = document.getElementById("profileGifGallery");
    const resultsContainer = document.getElementById("profileSearchResults");

    // ✅ Hide dashboard elements when searching
    const profileHeader = document.querySelector(".profile-header");
    const profileDashboardText = document.getElementById(
      "profileDashboardText",
    );
    const profileSubheader = document.querySelector(".profile-subheader");
    if (profileHeader) profileHeader.style.display = "none";
    if (profileDashboardText) profileDashboardText.style.display = "none";
    if (profileSubheader) profileSubheader.style.display = "none";

    if (profileGallery) {
      profileGallery.style.display = "block";
      displayProfileSearchResults(data.data, favorites, currentSearchQuery);
    }

    if (resultsContainer) {
      if (data.data && data.data.length > 0) {
        resultsContainer.style.display = "block";
        resultsContainer.classList.add("active");
      } else {
        resultsContainer.style.display = "none";
      }
    }
  } else {
    // logged out → homepage search
    const featureSection = document.getElementById("feature-section");
    if (featureSection) featureSection.style.display = "block";
    displayGifs(data.data, favorites, true, currentSearchQuery);
  }
});

async function displayFavoritesSearch(query) {
  const data = await fetchGifs(query);
  let favorites = [];
  if (userProfile) {
    favorites = await getFavorites();
  }

  const favoritesGrid = document.getElementById("favoritesGrid");
  if (favoritesGrid) {
    favoritesGrid.innerHTML = "";
    data.data.forEach((gif) => {
      const gifWrapper = document.createElement("div");
      gifWrapper.className = "gif-item";

      const img = document.createElement("img");
      img.src =
        gif.images?.fixed_height?.url ||
        gif.images?.downsized?.url ||
        gif.images?.original?.url;
      img.alt = gif.title || "GIF";

      if (userProfile) {
        const favButton = document.createElement("button");
        favButton.className = "fav-btn";
        const isFavorited = favorites.some((fav) => fav.id === gif.id);
        favButton.textContent = isFavorited ? "❤️" : "🤍";
        if (isFavorited) favButton.classList.add("active");
        favButton.addEventListener("click", () => toggleFavorite(gif));
        gifWrapper.appendChild(favButton);
      }

      gifWrapper.appendChild(img);
      favoritesGrid.appendChild(gifWrapper);
    });

    initMasonry("favoritesGrid");
  }
}

window.addEventListener("resize", () => {
  initMasonry("gifResults");
  initMasonry("profileGifResults");
  initMasonry("favoritesGrid");
});
