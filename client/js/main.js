let lastDisplayedGifs = [];
let infiniteScrollEnabled = false;
let currentSearchQuery = "";

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
    const data = await fetchGifs(query); // ✅ fetch GIFs
    const favorites = await getFavorites(); // ✅ fetch backend favorites
    displayGifs([...lastDisplayedGifs, ...data.data], favorites);
  } catch (error) {
    showError("Oops! something went wrong!");
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
      resultsContainer.innerHTML = "";
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
      displayGifs(data.data, false, "");
    } catch (err) {
      showError("Could not load trending GIFs. Try again.");
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

    if (!query) return;

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

function hideAllSections() {
  document.getElementById("feature-section").style.display = "none";
  document.getElementById("profile").style.display = "none";
  document.getElementById("favorites").style.display = "none";
}

// Initial load of trending GIFs
fetchGifs("").then(async (data) => {
  const favorites = await getFavorites(); // ✅ fetch backend favorites
  displayGifs(data.data, favorites, false, ""); // ✅ pass favorites in
});

// Search form submit handler
searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Clear suggestions immediately
  if (suggestionsContainer) suggestionsContainer.innerHTML = "";
  searchBar.blur();

  currentSearchQuery = searchBar.value.trim();
  const resultsContainer = document.getElementById("profileSearchResults");

  // Empty query → reset homepage
  if (!currentSearchQuery) {
    if (resultsContainer) {
      resultsContainer.classList.remove("active");
      resultsContainer.style.display = "none";
      resultsContainer.innerHTML = "";
    }
    const data = await fetchGifs("");
    const favorites = await getFavorites(); // ✅ fetch backend favorites
    displayGifs(data.data, favorites, false, "");
    return;
  }

  const data = await fetchGifs(currentSearchQuery);
  const favorites = await getFavorites();

  if (userProfile && userProfile.username) {
    // logged in → profile search
    const profileGallery = document.getElementById("profileGifGallery");
    if (profileGallery) {
      profileGallery.style.display = "block";
      displayProfileSearchResults(data.data, favorites, currentSearchQuery); // ✅ pass favorites in
    }
  } else {
    // logged out → homepage search
    userProfile = null;
    localStorage.clear();
    const featureSection = document.getElementById("feature-section");
    if (featureSection) featureSection.style.display = "block";
    displayGifs(data.data, favorites, true, currentSearchQuery);
  }
});
