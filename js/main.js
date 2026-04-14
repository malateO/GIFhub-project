let lastDisplayedGifs = [];

const gifGallery = document.getElementById("gifGallery");
const searchBar = document.getElementById("searchBar");

const popupOverlay = document.querySelector(".popup-overlay");
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const authPopup = document.getElementById("auth-popup");

fetchGifs("").then((data) => displayGifs(data.data));
if (userProfile) {
  displayFavorites("profileFavorites", "profile-gif");
}
searchBar.addEventListener(
  "input",
  debounce(async (event) => {
    const gifs = await handleSearch(event);
    if (gifs) {
      displayGifs(gifs);
    } else {
      showError("Oops! Something went wrong fetching GIFS");
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

window.addEventListener("scroll", async () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    const query = searchBar.value.trim();
    const data = await fetchGifs(query);
    displayGifs([...lastDisplayedGifs, ...data.data]);
  }
});

authPopup.addEventListener("click", (e) => {
  if (e.target === authPopup) {
    closeModal();
  }
});

document.getElementById("guestIcon").addEventListener("click", openModal);
