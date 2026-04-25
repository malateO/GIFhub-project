let userProfile = null;

const savedProfile = localStorage.getItem("userProfile");
if (savedProfile) {
  userProfile = JSON.parse(savedProfile);
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

//-------Account Stub-------//
function createStubUser(username) {
  return {
    username: username,
    email: `${username}@example.com`,
    favorites: [],
  };
}

async function login(username, password) {
  //ignore password for now
  if (userProfile) return;

  userProfile = createStubUser(username);
  updateUI();

  const query = searchBar.value.trim();
  const data = await fetchGifs(query || "");
  displayGifs(data.data, true, query);

  localStorage.setItem("userProfile", JSON.stringify(userProfile));

  closeModal();
}

function logout() {
  userProfile = null;
  localStorage.removeItem("userProfile");
  updateUI();

  const query = searchBar.value.trim();
  fetchGifs(query || "").then((data) => {
    displayGifs(data.data, true, query);
  });
  closeModal();
}

function createAccount(username, password) {
  userProfile = createStubUser(username);
  updateUI();
  closeModal();
}

function getRandomTagline() {
  const index = Math.floor(Math.random() * taglines.length);
  return taglines[index];
}

function updateUI() {
  const profileSection = document.getElementById("profile");
  const featureSection = document.getElementById("feature-section");
  const loginStatus = document.getElementById("loginStatus");

  if (userProfile) {
    profileSection.style.display = "block";
    featureSection.style.display = "block";
    document.getElementById("welcomeMessage").textContent =
      `Welcome ${userProfile.username}`;
    document.getElementById("profileEmail").textContent =
      `Email: ${userProfile.email}`;
    document.getElementById("profileTagline").textContent = getRandomTagline();

    displayFavorites("profileFavorites", "profile-gif");

    loginStatus.textContent = "Logged In";
    loginStatus.style.color = "#2ecc71";
  } else {
    profileSection.style.display = "none";
    featureSection.style.display = "block";

    loginStatus.textContent = "Guest";
    loginStatus.style.color = "#e74c3c";
  }
}

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
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;
  login(username, password);
  document.getElementById("loginUsername").value = "";
  document.getElementById("loginPassword").value = "";
  //uses stub login

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
