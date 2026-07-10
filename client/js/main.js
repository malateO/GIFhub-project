import { fetchGifs, fetchSuggestions, debounce } from "./api.js";
import {
  displayGifs,
  displayProfileSearchResults,
  hideAllSections,
  getFavorites,
  showHomePage,
  showProfilePage,
  showFavoritesPage,
  showAboutPage,
  clearSearchState,
  displayFavoritesSearch,
  initMasonry,
} from "./ui.js";
import { toggleFavorite, displayFavorites } from "./favorites.js";
import {
  login,
  logout,
  createAccount,
  updateUI,
  showToast,
  openModal,
  closeModal,
  userProfile,
} from "./auth.js";
import {
  lastDisplayedGifs,
  currentSearchQuery,
  favoritesSearchActive,
  setLastDisplayedGifs,
  setCurrentSearchQuery,
  setFavoritesSearchActive,
} from "./state.js";

// Navbar + footer navigation
document.addEventListener("DOMContentLoaded", () => {
  const homeLink = document.getElementById("homeLink");
  if (homeLink) homeLink.addEventListener("click", goHome);

  const aboutLink = document.getElementById("aboutLink");
  if (aboutLink) aboutLink.addEventListener("click", goAbout);

  const profileLink = document.getElementById("profileLink");
  if (profileLink) profileLink.addEventListener("click", goProfile);

  const favoritesLink = document.getElementById("favoritesLink");
  if (favoritesLink) favoritesLink.addEventListener("click", goFavorites);

  // Footer links
  const footerHomeLink = document.getElementById("footerHomeLink");
  if (footerHomeLink) footerHomeLink.addEventListener("click", goHome);

  const footerFavoritesLink = document.getElementById("footerFavoritesLink");
  if (footerFavoritesLink)
    footerFavoritesLink.addEventListener("click", goFavorites);

  const footerProfileLink = document.getElementById("footerProfileLink");
  if (footerProfileLink) footerProfileLink.addEventListener("click", goProfile);

  const footerAboutLink = document.getElementById("footerAboutLink");
  if (footerAboutLink) footerAboutLink.addEventListener("click", goAbout);

  const aboutIcon = document.getElementById("aboutIcon");
  if (aboutIcon) aboutIcon.addEventListener("click", goAbout);

  const closeModalBtn = document.getElementById("closeModalBtn");
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
});

let infiniteScrollEnabled = false;
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

const themeIcon = document.getElementById("themeIcon");
const themeSwitch = document.getElementById("themeSwitch");

// --- Navigation Wrappers ---
// These wrap UI navigation functions and also reset state variables

function goHome() {
  showHomePage();
  setCurrentSearchQuery("");
  setFavoritesSearchActive(false);
  isSubmittingSearch = false;
  lastActiveSection = "home";
  localStorage.setItem("lastActiveSection", lastActiveSection);

  // ✅ Clear other sections
  document.getElementById("profileGifResults").innerHTML = "";
  document.getElementById("favoritesGrid").innerHTML = "";
}

function goProfile() {
  showProfilePage();
  setCurrentSearchQuery("");
  setFavoritesSearchActive(false);
  isSubmittingSearch = false;
  lastActiveSection = "profile";
  localStorage.setItem("lastActiveSection", lastActiveSection);

  // ✅ Clear other sections
  document.getElementById("gifResults").innerHTML = "";
  document.getElementById("favoritesGrid").innerHTML = "";
}

function goFavorites() {
  // Show the Favorites section first
  showFavoritesPage();

  // Reset state completely
  setCurrentSearchQuery(""); // ✅ clear query
  setFavoritesSearchActive(false);
  isSubmittingSearch = false;
  lastActiveSection = "favorites";
  localStorage.setItem("lastActiveSection", lastActiveSection);

  // ✅ Reset header
  const favoritesHeader = document.getElementById("favoritesHeader");
  if (favoritesHeader) {
    favoritesHeader.textContent = "My Favorites";
  }

  // ✅ Always show default favorites
  displayFavorites("favoritesGrid", true);
}

function goAbout() {
  showAboutPage();
  setCurrentSearchQuery("");
  setFavoritesSearchActive(false);
  isSubmittingSearch = false;
  lastActiveSection = "about";
  localStorage.setItem("lastActiveSection", lastActiveSection);
}

themeSwitch.addEventListener("change", () => {
  if (themeSwitch.checked) {
    document.body.classList.add("dark-mode");
    themeIcon.textContent = "light_mode"; // show sun when dark
    localStorage.setItem("theme", "dark");
  } else {
    document.body.classList.remove("dark-mode");
    themeIcon.textContent = "dark_mode"; // show moon when light
    localStorage.setItem("theme", "light");
  }
});

// ✅ Load saved preference
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.body.classList.add("dark-mode");
  if (themeSwitch) themeSwitch.checked = true;
  if (themeIcon) themeIcon.textContent = "light_mode";
} else {
  if (themeSwitch) themeSwitch.checked = false;
  if (themeIcon) themeIcon.textContent = "dark_mode";
}

async function loadMoreGifs(query) {
  try {
    // Fetch next batch of GIFs using offset
    const data = await fetchGifs(query, lastDisplayedGifs.length, 20);
    if (!data.data || data.data.length === 0) {
      return false; // ✅ signal no more results
    }

    // Update shared state
    setLastDisplayedGifs([...lastDisplayedGifs, ...data.data]);
    setCurrentSearchQuery(query);

    // Get favorites if logged in
    let favorites = [];
    if (userProfile) {
      favorites = await getFavorites();
    }

    // Display updated GIFs
    displayGifs(lastDisplayedGifs, favorites);
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
        setFavoritesSearchActive(false);
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
    showFavoritesPage(); // ✅ make section visible first
    setFavoritesSearchActive(true);
    setCurrentSearchQuery(query);

    const favoritesHeader = document.getElementById("favoritesHeader");
    if (favoritesHeader) {
      favoritesHeader.textContent = `Search Results for ${query}`;
    }

    await displayFavoritesSearch(currentSearchQuery);
    isSubmittingSearch = false;
    return;
  }

  // --- Profile page search ---
  if (document.getElementById("profile").style.display === "block") {
    setFavoritesSearchActive(false);
    setCurrentSearchQuery(query);

    const profileHeader = document.getElementById("profileFeatureHeader");
    if (profileHeader) {
      profileHeader.textContent = `Search Results for ${query}`;
    }

    const data = await fetchGifs(query);
    const favorites = userProfile ? await getFavorites() : [];
    displayProfileSearchResults(data.data, favorites, query);

    isSubmittingSearch = false;
    return;
  }

  // --- Home page search ---
  showHomePage(); // ✅ make section visible first
  setCurrentSearchQuery(query);
  const data = await fetchGifs(currentSearchQuery);
  const favorites = userProfile ? await getFavorites() : [];
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

window.addEventListener("resize", () => {
  initMasonry("gifResults");
  initMasonry("profileGifResults");
  initMasonry("favoritesGrid");
});

// main.js
export function resetSearchState() {
  setCurrentSearchQuery("");
  setFavoritesSearchActive(false);
  setLastDisplayedGifs([]);
  isSubmittingSearch = false;
  infiniteScrollEnabled = false;

  const searchBar = document.getElementById("searchBar");
  if (searchBar) searchBar.value = "";

  const suggestionsContainer = document.getElementById("searchSuggestions");
  if (suggestionsContainer) suggestionsContainer.innerHTML = "";
}
