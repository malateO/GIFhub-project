const API_KEY = "HWjUB90d31Rn3R81AZn7AEIsGSnjEYCr";

let userProfile = null; //starts logged out
let lastDisplayedGifs = [];

const gifGallery = document.getElementById("gifGallery");
const searchBar = document.getElementById("searchBar");

const taglines = [
  "Certified Meme Lord 🏆",
  "Saving GIFs like it\’s a full-time job 💼",
  "Keeper of the LOLs 😂",
  "Professional GIF curator 🎨",
  "Brofessional in GIFconomics 📈",
  "Legit Aura Farmer 🌾✨",
];

//-------Account Stub-------//
function createStubUser(username) {
  return {
    username: username,
    email: `${username}@example.com`,
    favorites: [],
  };
}

function login(username, password) {
  //ignore password for now
  userProfile = createStubUser(username);
  updateUI();
  closeAuthPopup();
}

function logout() {
  userProfile = null;
  updateUI();
}

function createAccount(username, password) {
  userProfile = createStubUser(username);
  updateUI();
  closeAuthPopup();
}

function getRandomTagline() {
  const index = Math.floor(Math.random() * taglines.length);
  return taglines[index];
}

function updateUI() {
  const profileSection = document.getElementById("profile");
  const featureSection = document.getElementById("feature-section");

  if (userProfile) {
    profileSection.style.display = "block";
    featureSection.style.display = "none";
    document.getElementById("welcomeMessage").textContent =
      `Welcome ${userProfile.username}`;
    document.getElementById("profileEmail").textContent =
      `Email: ${userProfile.email}`;
    document.getElementById("profileTagline").textContent = getRandomTagline();
    displayFavorites("profileFavorites", "profile-gif");
  } else {
    profileSection.style.display = "none";
    featureSection.style.display = "block";
  }
}

// 1. Utility
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// 2. Fetching
async function fetchGifs(query) {
  const endpoint = query
    ? `https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=pg-13`
    : `https://api.giphy.com/v1/gifs/trending?api_key=${API_KEY}&limit=25&rating=pg-13`;

  const response = await fetch(endpoint);
  return response.json();
}

async function handleSearch(event) {
  const query = event.target.value.trim();
  const spinner = document.getElementById("loadingSpinner");
  if (spinner) spinner.style.display = "block";

  try {
    const data = await fetchGifs(query);
    displayGifs(data.data);
  } catch (error) {
    console.error("Error fetching GIF's", error);
    document.getElementById("gifResults").textContent = "Error fetching GIF's";
  } finally {
    if (spinner) spinner.style.display = "none";
  }
}

// 3. Display
function displayGifs(gifs) {
  lastDisplayedGifs = gifs;
  const resultContainer = document.getElementById("gifResults");
  resultContainer.innerHTML = "";

  if (!gifs || gifs.length === 0) {
    resultContainer.classList.remove("grid");
    resultContainer.classList.add("flex"); // NEW: switch to flex mode

    const message = document.createElement("div");
    message.className = "no-results";

    const icon = document.createElement("span");
    icon.className = "material-symbols-outlined";
    icon.textContent = "search";

    const text = document.createElement("span");
    text.textContent = "No GIF's found. Try another search!";

    message.appendChild(icon);
    message.appendChild(text);
    resultContainer.appendChild(message);
    return;
  }

  resultContainer.classList.remove("flex"); // remove flex if results exist
  resultContainer.classList.add("grid"); // keep grid for GIFs

  gifs.forEach((gif) => {
    const imgUrl =
      gif.images?.fixed_height?.url ||
      gif.images?.downsized?.url ||
      gif.images?.original?.url;

    if (imgUrl) {
      const gifWrapper = document.createElement("div");
      gifWrapper.className = "gif-item";

      const img = document.createElement("img");
      img.src = imgUrl;
      img.alt = gif.title || "GIF";

      const favButton = document.createElement("button");
      favButton.className = "fav-btn";

      const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
      const isFavorited = favorites.some((fav) => fav.id === gif.id);

      favButton.textContent = isFavorited ? "❤️" : "🤍";
      if (isFavorited) favButton.classList.add("active");

      favButton.addEventListener("click", () => toggleFavorite(gif));

      gifWrapper.appendChild(img);
      gifWrapper.appendChild(favButton);
      resultContainer.appendChild(gifWrapper);
    }
  });
}

function displayFavorites(containerId, wrapperClass) {
  if (!userProfile) return;

  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  favorites.forEach((gif) => {
    const gifWrapper = document.createElement("div");
    gifWrapper.className = wrapperClass;

    const img = document.createElement("img");
    img.src = gif.images.fixed_height.url;
    img.alt = gif.title || "Favorite GIF";

    const favButton = document.createElement("button");
    favButton.className = "fav-btn active";
    favButton.textContent = "❤️";

    // Allow removing directly from Favorites
    favButton.addEventListener("click", () => toggleFavorite(gif));

    gifWrapper.appendChild(img);
    gifWrapper.appendChild(favButton);
    container.appendChild(gifWrapper);
  });
}

// 4. Interactions
function toggleFavorite(gif) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const exists = favorites.find((fav) => fav.id === gif.id);

  if (exists) {
    // Remove if already favorited
    favorites = favorites.filter((fav) => fav.id !== gif.id);
  } else {
    // Add if not favorited
    favorites.push(gif);
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));

  // Refresh all views to stay in sync
  if (userProfile) {
    displayFavorites("profileFavorites", "profile-gif");
  }
  displayGifs(lastDisplayedGifs);
}

//login/signup
function openAuthPopup() {
  document.getElementById("auth-popup").style.display = "flex";
}

function closeAuthPopup() {
  document.getElementById("auth-popup").style.display = "none";
}

function handleAuth(event) {
  event.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  login(username, password); //user your stub login
}

function signup() {
  const username = document.getElementById("usernae").value;
  const password = document.getElementById("password").value;
  createAccount(username, password); //user your stub signup
  closeAuthPopup();
}

// 5. Event Listeners
fetchGifs("").then((data) => displayGifs(data.data));
if (userProfile) {
  displayFavorites("profileFavorites", "profile-gif");
}
searchBar.addEventListener("input", debounce(handleSearch, 500)); // Search with debounce
