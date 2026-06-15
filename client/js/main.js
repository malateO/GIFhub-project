let lastDisplayedGifs = [];
let infiniteScrollEnabled = false;
let currentSearchQuery = "";
let favoritesSearchActive = false;
let isLoadingMore = false; // ✅ prevent duplicate fetches
let isSubmittingSearch = false;
let lastActiveSection = "home"; // can be "home", "profile", or "favorites"

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

// --- Search state helper ---
function clearSearchState() {
  // Clear global query and flags
  currentSearchQuery = "";
  favoritesSearchActive = false;
  isSubmittingSearch = false;

  // Clear search input UI
  if (searchBar) searchBar.value = "";

  // Hide profile search results UI
  const profileResults = document.getElementById("profileSearchResults");
  if (profileResults) {
    profileResults.style.display = "none";
    profileResults.classList.remove("active");
  }

  // Reset profile header
  const profileHeader = document.getElementById("profileFeatureHeader");
  if (profileHeader) profileHeader.textContent = "Profile GIFs";

  // Reset favorites header
  const favoritesHeader = document.getElementById("favoritesHeader");
  if (favoritesHeader) favoritesHeader.textContent = "My Favorites";

  // Clear result containers to avoid overlap
  const profileGrid = document.getElementById("profileGifResults");
  if (profileGrid) profileGrid.innerHTML = "";
  const favoritesGrid = document.getElementById("favoritesGrid");
  if (favoritesGrid) favoritesGrid.innerHTML = "";
  const gifResults = document.getElementById("gifResults");
  if (gifResults) gifResults.innerHTML = "";
}

async function loadMoreGifs(query) {
  try {
    const data = await fetchGifs(query, lastDisplayedGifs.length, 20); // ✅ use offset
    if (!data.data || data.data.length === 0) {
      return false; // ✅ signal no more results
    }

    let favorites = [];
    if (userProfile) {
      favorites = await getFavorites();
    }
    displayGifs([...lastDisplayedGifs, ...data.data], favorites);
    return true;
  } catch (error) {
    console.error("GIF fetch failed", error);
    showToast("GIF fetch failed", "error"); // ✅ toast notification
    return false;
  } finally {
    spinner.style.display = "none";
  }
}

// add this near top of main.js
async function onGalleryScroll() {
  if (isLoadingMore) return; // prevent duplicate fetches
  if (
    gifGallery.scrollTop + gifGallery.clientHeight >=
    gifGallery.scrollHeight - 200
  ) {
    isLoadingMore = true;
    const query = searchBar.value.trim();
    const success = await loadMoreGifs(query);
    if (!success) {
      showToast("No more GIFs to load", "info"); // ✅ toast notification
      gifGallery.removeEventListener("scroll", onGalleryScroll);
    }
    isLoadingMore = false;
  }
}

const favoritesGallery = document.getElementById("favoritesGallery");
favoritesGallery.addEventListener("scroll", async () => {
  if (
    favoritesGallery.scrollTop + favoritesGallery.clientHeight >=
    favoritesGallery.scrollHeight - 200
  ) {
    if (favoritesSearchActive && !isLoadingMore) {
      isLoadingMore = true;
      const success = await displayFavoritesSearch(
        currentSearchQuery,
        lastDisplayedGifs.length,
      );
      if (!success) {
        showToast("No more Favorites results", "info"); // ✅ toast
        favoritesGallery.removeEventListener("scroll", this);
      }
      isLoadingMore = false;
    }
  }
});

// when enabling infinite scroll:
gifGallery.addEventListener("scroll", onGalleryScroll);

// when disabling/resetting:
gifGallery.removeEventListener("scroll", onGalleryScroll);

// shared suggestions container (declare near other DOM refs)
const suggestionsContainer = document.getElementById("searchSuggestions");

searchBar.addEventListener(
  "input",
  debounce(async (event) => {
    if (isSubmittingSearch) return;

    const query = event.target.value.trim();
    // Clear suggestions container
    if (suggestionsContainer) suggestionsContainer.innerHTML = "";

    // If the input is empty, restore the current page's default UI
    if (!query) {
      // If on Favorites page, show default favorites
      if (document.getElementById("favorites").style.display === "block") {
        favoritesSearchActive = false;
        displayFavorites("favoritesGrid", true);
      } else if (document.getElementById("profile").style.display === "block") {
        // On profile page, hide search results and show dashboard
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
        if (resultsContainer) {
          resultsContainer.style.display = "none";
          resultsContainer.classList.remove("active");
        }
      } else {
        // Home page: restore trending
        const data = await fetchGifs("");
        const favorites = await getFavorites();
        displayGifs(data.data, favorites, false, "");
      }
      return;
    }

    // Otherwise fetch suggestions
    try {
      const suggestions = await fetchSuggestions(query);
      suggestions.forEach((s) => {
        const suggestionItem = document.createElement("div");
        suggestionItem.className = "suggestion-item";
        suggestionItem.textContent = s;
        suggestionItem.addEventListener("click", () => {
          searchBar.value = s;
          if (suggestionsContainer) suggestionsContainer.innerHTML = "";
          searchForm.requestSubmit();
        });
        suggestionsContainer.appendChild(suggestionItem);
      });
    } catch (err) {
      console.error("Suggestion fetch failed", err);
    }
  }, 400),
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
// searchBar.addEventListener(
//   "input",
//   debounce(async (event) => {
//     const query = event.target.value.trim();
//     if (!suggestionsContainer) return;
//     suggestionsContainer.innerHTML = "";

//     if (!query) {
//       favoritesSearchActive = false; // ✅ reset when query is cleared
//       // ✅ Restore Profile dashboard when search is cleared
//       if (userProfile && userProfile.username) {
//         const profileHeader = document.querySelector(".profile-header");
//         const profileDashboardText = document.getElementById(
//           "profileDashboardText",
//         );
//         const profileSubheader = document.querySelector(".profile-subheader");
//         const resultsContainer = document.getElementById(
//           "profileSearchResults",
//         );

//         if (profileHeader) profileHeader.style.display = "flex";
//         if (profileDashboardText) profileDashboardText.style.display = "block";
//         if (profileSubheader) profileSubheader.style.display = "block";
//         if (resultsContainer) resultsContainer.style.display = "none";
//       }

//       return; // stop here, don’t fetch suggestions
//     }

//     try {
//       const suggestions = await fetchSuggestions(query);
//       suggestions.forEach((s) => {
//         const suggestionItem = document.createElement("div");
//         suggestionItem.className = "suggestion-item";
//         suggestionItem.textContent = s;

//         suggestionItem.addEventListener("click", () => {
//           searchBar.value = s;
//           suggestionsContainer.innerHTML = "";
//           searchForm.requestSubmit();
//         });

//         suggestionsContainer.appendChild(suggestionItem);
//       });
//     } catch (err) {
//       console.error("Suggestion fetch failed", err);
//     }
//   }, 500),
// );

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

// Initial load of GIFs based on saved section
// const savedSection = localStorage.getItem("lastActiveSection") || "home";

// if (savedSection === "home") {
//   fetchGifs("").then(async (data) => {
//     const favorites = userProfile ? await getFavorites() : [];
//     displayGifs(data.data, favorites, false, "");
//   });
// }
// ✅ For profile/favorites, let updateUI() handle the correct fetch.

// Search form submit handler
searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (isSubmittingSearch) return;
  isSubmittingSearch = true;

  const query = searchBar && searchBar.value ? searchBar.value.trim() : "";
  if (!query) {
    showToast("Please enter a search term", "info");
    isSubmittingSearch = false;
    return;
  }

  // --- Favorites page search ---
  if (document.getElementById("favorites").style.display === "block") {
    // Clear other UI state but keep Favorites visible
    clearSearchState();
    favoritesSearchActive = true;
    currentSearchQuery = query;
    await displayFavoritesSearch(currentSearchQuery);
    isSubmittingSearch = false;
    return;
  }

  // --- Profile page search ---
  if (document.getElementById("profile").style.display === "block") {
    // Clear other UI state and hide profile dashboard elements
    clearSearchState();
    currentSearchQuery = query;

    // Hide profile dashboard so only search results are visible
    const profileHeader = document.querySelector(".profile-header");
    const profileDashboardText = document.getElementById(
      "profileDashboardText",
    );
    const profileSubheader = document.querySelector(".profile-subheader");
    const resultsContainer = document.getElementById("profileSearchResults");
    if (profileHeader) profileHeader.style.display = "none";
    if (profileDashboardText) profileDashboardText.style.display = "none";
    if (profileSubheader) profileSubheader.style.display = "none";

    // Show results container and run the search
    if (resultsContainer) {
      resultsContainer.style.display = "block";
      resultsContainer.classList.add("active");
    }

    const data = await fetchGifs(currentSearchQuery);
    const favorites = userProfile ? await getFavorites() : [];
    displayProfileSearchResults(data.data, favorites, currentSearchQuery);

    isSubmittingSearch = false;
    return;
  }

  // --- Home / Feature search ---
  clearSearchState();
  currentSearchQuery = query;
  const data = await fetchGifs(currentSearchQuery);
  const favorites = userProfile ? await getFavorites() : [];
  const featureSection = document.getElementById("feature-section");
  if (featureSection) featureSection.style.display = "block";
  displayGifs(data.data, favorites, true, currentSearchQuery);

  isSubmittingSearch = false;
});

// ensure other sections don't show results
const profileResults = document.getElementById("profileSearchResults");
if (profileResults) {
  profileResults.style.display = "none";
  profileResults.classList.remove("active");
}
const gifResults = document.getElementById("gifResults");
if (gifResults) gifResults.innerHTML = "";

async function displayFavoritesSearch(query, offset = 0, limit = 20) {
  const data = await fetchGifs(query, offset, limit);
  let favorites = [];
  if (userProfile) {
    favorites = await getFavorites();
  }

  // ✅ Update Favorites header to show search query
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

function showProfilePage() {
  hideAllSections();
  clearSearchState();
  lastActiveSection = "profile";
  localStorage.setItem("lastActiveSection", lastActiveSection);

  const profileSection = document.getElementById("profile");
  if (profileSection) profileSection.style.display = "block";

  const resultsContainer = document.getElementById("profileSearchResults");
  if (resultsContainer) resultsContainer.style.display = "none";

  window.profileSearchState = { query: "", offset: 0, limit: 20 };
}

function showFavoritesPage() {
  hideAllSections();
  clearSearchState();
  lastActiveSection = "favorites";
  localStorage.setItem("lastActiveSection", lastActiveSection);

  const favoritesSection = document.getElementById("favorites");
  if (favoritesSection) favoritesSection.style.display = "block";

  if (typeof displayFavorites === "function") {
    displayFavorites("favoritesGrid", true);
  }
}

function showHomePage() {
  hideAllSections();
  clearSearchState();
  lastActiveSection = "home";
  localStorage.setItem("lastActiveSection", lastActiveSection);

  const featureSection = document.getElementById("feature-section");
  if (featureSection) featureSection.style.display = "block";

  // reload trending GIFs immediately when navigating Home
  fetchGifs("").then(async (data) => {
    const favorites = userProfile ? await getFavorites() : [];
    displayGifs(data.data, favorites, false, "");
  });
}

// ✅ Expose globally so HTML onclick works
window.showProfilePage = showProfilePage;
window.showFavoritesPage = showFavoritesPage;
window.showHomePage = showHomePage;
