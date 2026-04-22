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

fetchGifs("").then((data) => displayGifs(data.data));
if (userProfile) {
  displayFavorites("profileFavorites", "profile-gif");
}

searchBar.addEventListener(
  "input",
  debounce(async (event) => {
    const query = event.target.value.trim();
    const suggestionsContainer = document.getElementById("searchSuggestions");
    suggestionsContainer.innerHTML = "";

    if (query) {
      const suggestions = await fetchSuggestions(query);
      suggestions.forEach((s) => {
        const suggestionItem = document.createElement("div");
        suggestionItem.className = "suggestion-item";
        suggestionItem.textContent = s;

        suggestionItem.addEventListener("click", async () => {
          searchBar.value = s;
          searchForm.requestSubmit();
          suggestionsContainer.innerHTML = "";
        });
        suggestionsContainer.appendChild(suggestionItem);
      });
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
    window.addEventListener("scroll", async () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 200
      ) {
        const query = searchBar.value.trim();
        await loadMoreGifs(query);
        displayGifs([...lastDisplayedGifs, ...data.data]);
      }
    });
  }
});

searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = searchBar.value.trim();

  if (query) {
    const data = await fetchGifs(query);
    displayGifs(data.data, true, query);
  } else {
    const data = await fetchGifs("");
    displayGifs(data.data, false);
  }
});

document.getElementById("guestIcon").addEventListener("click", openModal);
