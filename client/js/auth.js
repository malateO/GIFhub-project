let userProfile = null;

const authIcon = document.getElementById("authIcon");
const profileDropdown = document.getElementById("profileDropdown");

// Check if a token exists in localStorage
const token = localStorage.getItem("token");
if (token) {
  // Option 1: If backend has a /api/me route, fetch profile info
  fetch("http://localhost:5000/api/me", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((data) => {
      userProfile = { username: data.username, email: data.email };
      updateUI();
    })
    .catch(() => {
      userProfile = null;
      localStorage.clear();
    });
} else {
  userProfile = null;
  updateUI();
}

const taglines = [
  "Certified Meme Lord 🏆",
  "Saving GIFs like it\’s a full-time job 💼",
  "Keeper of the LOLs 😂",
  "Professional GIF curator 🎨",
  "Brofessional in GIFconomics 📈",
  "Legit Aura Farmer 🌾✨",
];

async function login(identifier, password) {
  try {
    const res = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: identifier,
        email: identifier,
        password,
      }),
    });
    const data = await res.json();

    if (res.ok) {
      // ✅ Save JWT only
      localStorage.setItem("token", data.token);

      // ✅ Backend must return username + email, or decode from JWT
      userProfile = { username: data.username, email: data.email };

      updateUI();
      closeModal();
    } else {
      alert(data.error || "Login failed");
    }
  } catch (err) {
    console.error("Login error:", err);
  }
}

function logout() {
  localStorage.clear();
  userProfile = null;
  currentSearchQuery = "";
  searchBar.value = "";
  profileSearchState = { query: "", offset: 0, limit: 20 };
  lastDisplayedGifs = [];
  infiniteScrollEnabled = false;

  // Hide all sections including favorites
  hideAllSections();

  // ✅ Clear suggestion dropdown
  const suggestionsContainer = document.getElementById("searchSuggestions");
  if (suggestionsContainer) suggestionsContainer.innerHTML = "";

  updateUI();

  fetchGifs("").then(async (data) => {
    const favorites = await getFavorites();
    displayGifs(data.data, favorites, false, "");
  });

  closeModal();
}

async function createAccount(username, password, email) {
  try {
    const res = await fetch("http://localhost:5000/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      userProfile = { username: data.username, email: data.email };
      updateUI();
      closeModal();
    } else {
      alert(data.error || "Signup failed");
    }
  } catch (err) {
    console.error("Signup error:", err);
  }
}

function getRandomTagline() {
  const index = Math.floor(Math.random() * taglines.length);
  return taglines[index];
}

function updateUI() {
  const featureSection = document.getElementById("feature-section");
  const profileSection = document.getElementById("profile");
  const loginStatus = document.getElementById("loginStatus");

  if (userProfile) {
    // logged in → show profile dashboard
    // reset profile search state and hide profile gallery content
    profileSearchState = { query: "", offset: 0, limit: 20 };
    const profileGrid = document.getElementById("profileGifResults");
    if (profileGrid) profileGrid.innerHTML = "";
    const profileLoadMore = document.getElementById("profileLoadMoreBtn");
    if (profileLoadMore) profileLoadMore.style.display = "none";

    featureSection.style.display = "none";
    profileSection.style.display = "block";

    loginStatus.textContent = userProfile.username;
    loginStatus.classList.add("logged-in");
    authIcon.classList.add("logged-in");

    // Set username + handle dynamically
    document.getElementById("welcomeMessage").textContent =
      userProfile.username;
    document.getElementById("profileHandle").textContent =
      "@" + userProfile.username;

    // reset dropdown state by removing "open"
    authIcon.classList.remove("open");
  } else {
    // logged out → hide profile completely
    // in logout()
    profileSearchState = { query: "", offset: 0, limit: 20 };
    const profileGrid = document.getElementById("profileGifResults");
    if (profileGrid) profileGrid.innerHTML = "";

    profileSection.style.display = "none";
    featureSection.style.display = "block";

    loginStatus.textContent = "Guest";
    loginStatus.classList.remove("logged-in");
    authIcon.classList.remove("logged-in");

    // Clear profile header
    document.getElementById("welcomeMessage").textContent = "";
    document.getElementById("profileHandle").textContent = "";

    // ensure dropdown is closed
    authIcon.classList.remove("open");
  }

  enableMobileDropdown();
}

function mobileAuthClickHandler() {
  if (userProfile) {
    // Logged in → toggle dropdown class only
    authIcon.classList.toggle("open");
  } else {
    // Logged out → open modal
    openModal();
  }
}

function enableMobileDropdown() {
  // Clean up first
  authIcon.removeEventListener("click", mobileAuthClickHandler);

  // Always allow click when logged out (to open modal)
  if (!userProfile) {
    authIcon.addEventListener("click", mobileAuthClickHandler);
    return;
  }

  // Only attach click handler for logged-in users on mobile
  if (window.matchMedia("(hover: none)").matches) {
    authIcon.addEventListener("click", mobileAuthClickHandler);
  }
}

enableMobileDropdown();

//Open modal
function openModal() {
  authPopup.style.visibility = "visible";
  authPopup.classList.add("show");

  authPopup.addEventListener(
    "transitionend",
    () => {
      const usernameInput = document.querySelector(
        "#loginForm input[name='username']",
      );
      if (usernameInput) usernameInput.focus();
    },
    { once: true },
  );
}

//Close Modal
function closeModal() {
  authPopup.classList.remove("show");

  setTimeout(() => {
    authPopup.style.visibility = "hidden";
  });
}

// ===== Tab Switching ======
loginTab.addEventListener("click", () => {
  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");
  loginTab.classList.add("active");
  signupTab.classList.remove("active");
});

signupTab.addEventListener("click", () => {
  signupForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  signupTab.classList.add("active");
  loginTab.classList.remove("active");
});

// login handler
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const identifier = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  login(identifier, password);

  document.getElementById("loginUsername").value = "";
  document.getElementById("loginPassword").value = "";

  if (document.getElementById("rememberMe").checked) {
    localStorage.setItem("savedAccount", username);
  }

  const savedAccount = localStorage.getItem("savedAccount");
  if (savedAccount) {
    document.getElementById("loginUsername").value = savedAccount;
  }
});

// signup Handler
signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("signupUsername").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;
  const confirmPassword = document.getElementById("signupConfirm").value;

  if (password !== confirmPassword) {
    alert("Password do not match");
    return;
  }

  createAccount(username, password, email);
});

async function loadProfileFavorites() {
  const token = localStorage.getItem("token");
  const res = await fetch("http://localhost:5000/api/favorites", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  // ✅ Make sure renderFavorites is implemented
  renderFavorites(data.favorites);
}
