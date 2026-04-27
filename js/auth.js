let userProfile = null;

const authIcon = document.getElementById("authIcon");
const profileDropdown = document.getElementById("profileDropdown");

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
  const featureSection = document.getElementById("feature-section");
  const profileSection = document.getElementById("profile");
  const loginStatus = document.getElementById("loginStatus");

  if (userProfile) {
    featureSection.style.display = "none";
    profileSection.style.display = "block";
    displayFavorites("profileFavorites");

    loginStatus.textContent = userProfile.username;
    loginStatus.classList.add("logged-in");
    authIcon.classList.add("logged-in");

    authIcon.onclick = null;
  } else {
    profileSection.style.display = "none";
    featureSection.style.display = "block";

    loginStatus.textContent = "Guest";
    loginStatus.classList.remove("logged-in");
    authIcon.classList.remove("logged-in");

    authIcon.onclick = openModal;
  }
}

function enableMobileDropdown() {
  //only enable click toggle if device does NOT support hover
  if (window.matchMedia("(hover: none)").matches) {
    authIcon.addEventListener("click", () => {
      if (userProfile) {
        // logged in → toggle dropdown
        profileDropdown.style.display =
          profileDropdown.style.display === "block" ? "none" : "block";
        //toggle chevron rotation with class
        authIcon.classList.toggle("open");
      } else {
        // Still open login modal when logged out
        openModal();
      }
    });
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
