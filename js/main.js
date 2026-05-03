let lastDisplayedGifs = [];
let infiniteScrollEnabled = false;

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
    displayGifs([...lastDisplayedGifs, ...data.data]);
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

fetchGifs("").then((data) => displayGifs(data.data));
// if (userProfile) {
//   displayFavorites("profileFavorites", "profile-gif");
// }

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
    if (suggestionsContainer) suggestionsContainer.innerHTML = "";
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

// fixed search submit handler
searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = searchBar.value.trim();

  // Clear suggestions right away
  if (suggestionsContainer) suggestionsContainer.innerHTML = "";

  // profile search container (may be toggled on/off)
  const resultsContainer = document.getElementById("profileSearchResults");

  if (query) {
    const data = await fetchGifs(query);

    if (userProfile) {
      // hide homepage feature section and show profile section
      const featureSection = document.getElementById("feature-section");
      const profileSection = document.getElementById("profile");
      if (featureSection) featureSection.style.display = "none";
      if (profileSection) profileSection.style.display = "block";

      // optionally hide profile dashboard header/text for search results
      const profileHeader = document.querySelector(".profile-header");
      const profileSubheader = document.querySelector(".profile-subheader");
      const profileDashboardText = document.getElementById(
        "profileDashboardText",
      );
      if (profileHeader) profileHeader.style.display = "none";
      if (profileSubheader) profileSubheader.style.display = "none";
      if (profileDashboardText) profileDashboardText.style.display = "none";

      // ensure the purple profile gallery is visible
      const profileGallery = document.getElementById("profileGifGallery");
      if (profileGallery) profileGallery.style.display = "block";

      // render results into the profile grid
      displayProfileSearchResults(data.data, query);
    } else {
      // logged out → ensure profile results are hidden, then show on homepage
      if (resultsContainer) {
        resultsContainer.classList.remove("active");
        resultsContainer.style.display = "none";
        resultsContainer.innerHTML = "";
      }

      displayGifs(data.data, true, query);
    }
  } else {
    // empty query → reset to trending/feature GIFs
    if (resultsContainer) {
      resultsContainer.classList.remove("active");
      resultsContainer.style.display = "none";
      resultsContainer.innerHTML = "";
    }

    const data = await fetchGifs("");
    displayGifs(data.data, false);
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

// main.js — fixed search handler
searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = searchBar.value.trim();

  // profile search container (may be toggled on/off)
  const resultsContainer = document.getElementById("profileSearchResults");

  if (query) {
    const data = await fetchGifs(query);

    if (userProfile) {
      // logged in → show results in profile area
      document.querySelector(".profile-header").style.display = "none";
      document.querySelector(".profile-subheader").style.display = "none";
      document.getElementById("profileDashboardText").style.display = "none";

      resultsContainer.classList.add("active");
      resultsContainer.style.display = "block";

      displayProfileSearchResults(data.data, query);
    } else {
      // logged out → ensure profile results are hidden, then show on homepage
      if (resultsContainer) {
        resultsContainer.classList.remove("active");
        resultsContainer.style.display = "none";
        resultsContainer.innerHTML = "";
      }

      displayGifs(data.data, true, query);
    }
  } else {
    // empty query → reset to trending/feature GIFs
    // hide profile search results if present
    if (resultsContainer) {
      resultsContainer.classList.remove("active");
      resultsContainer.style.display = "none";
      resultsContainer.innerHTML = "";
    }

    const data = await fetchGifs("");
    displayGifs(data.data, false);
  }
  console.log("search submit:", { query, userProfile });
});
