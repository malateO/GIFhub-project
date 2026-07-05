import {
  hideAllSections,
  showHomePage,
  showProfilePage,
  showFavoritesPage,
  displayGifs,
} from "./ui.js";
import { resetSearchState } from "./main.js";
import { fetchGifs } from "./api.js";

export let userProfile = null;

const authPopup = document.getElementById("auth-popup");
const authIcon = document.getElementById("authIcon");
const profileDropdown = document.getElementById("profileDropdown");

// Check if a token exists in localStorage
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const res = await fetch("http://localhost:5000/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        userProfile = {
          username: data.username,
          email: data.email,
          profileImage: data.profileImage,
        };
      } else {
        localStorage.clear();
        userProfile = null;
      }
    } catch (err) {
      localStorage.clear();
      userProfile = null;
    }
  } else {
    userProfile = null;
  }
  updateUI();
});

const taglines = [
  "Certified Meme Lord 🏆",
  "Saving GIFs like it’s a full-time job 💼",
  "Keeper of the LOLs 😂",
  "Professional GIF curator 🎨",
  "Brofessional in GIFconomics 📈",
  "Legit Aura Farmer 🌾✨",
];

export async function login(identifier, password) {
  try {
    const res = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      userProfile = {
        username: data.username,
        email: data.email,
        profileImage: data.profileImage || null,
      };
      updateUI();
      closeModal();

      document.getElementById("loginUsername").value = "";
      document.getElementById("loginPassword").value = "";
      resetSearchState(); // ✅ clears search state safely
    } else {
      alert(data.error || "Login failed");
    }
  } catch (err) {
    console.error("Login error:", err);
  }
}

export function logout() {
  userProfile = null;
  resetSearchState(); // ✅ clears search state safely

  hideAllSections();

  updateUI();

  fetchGifs("").then((data) => {
    displayGifs(data.data, [], false, "");
  });

  closeModal();

  authPopup.classList.remove("show");
  authPopup.style.visibility = "hidden";
  authIcon.classList.remove("open");
  authIcon.removeEventListener("click", mobileAuthClickHandler);
  enableMobileDropdown();

  showToast("You are now browsing as Guest");
}

export async function createAccount(username, password, email) {
  try {
    const res = await fetch("http://localhost:5000/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      userProfile = {
        username: data.username,
        email: data.email,
        profileImage: data.profileImage || null,
      };
      updateUI();
      closeModal();
    } else {
      alert(data.error || "Signup failed");
    }
  } catch (err) {
    console.error("Signup error:", err);
  }
}

export function getRandomTagline() {
  const index = Math.floor(Math.random() * taglines.length);
  return taglines[index];
}

export function updateUI() {
  document.querySelector(".profile-avatar").src =
    userProfile?.profileImage || "assets/profile-avatar.png";

  const loginStatus = document.getElementById("loginStatus");
  const savedSection = localStorage.getItem("lastActiveSection") || "home";

  hideAllSections();

  if (userProfile) {
    loginStatus.textContent = userProfile.username;
    loginStatus.classList.add("logged-in");
    authIcon.classList.add("logged-in");
    document.getElementById("welcomeMessage").textContent =
      userProfile.username;
    document.getElementById("profileHandle").textContent =
      "@" + userProfile.username;
    authIcon.classList.remove("open");

    if (savedSection === "favorites") {
      showFavoritesPage();
    } else if (savedSection === "profile") {
      showProfilePage();
    } else {
      showHomePage();
    }
  } else {
    loginStatus.textContent = "Guest";
    loginStatus.classList.remove("logged-in");
    authIcon.classList.remove("logged-in");
    document.getElementById("welcomeMessage").textContent = "";
    document.getElementById("profileHandle").textContent = "";
    authIcon.classList.remove("open");

    if (savedSection === "favorites") {
      showFavoritesPage();
    } else if (savedSection === "profile") {
      showProfilePage();
    } else {
      showHomePage();
    }
  }

  enableMobileDropdown();
}

function mobileAuthClickHandler() {
  if (userProfile) {
    authIcon.classList.toggle("open");
  } else {
    openModal();
  }
}

export function enableMobileDropdown() {
  authIcon.removeEventListener("click", mobileAuthClickHandler);

  if (!userProfile) {
    setTimeout(() => {
      authIcon.addEventListener("click", mobileAuthClickHandler);
    }, 0);
    return;
  }

  if (window.matchMedia("(hover: none)").matches) {
    authIcon.addEventListener("click", mobileAuthClickHandler);
  }
}

// Open modal
export function openModal() {
  if (!authPopup) return; // ✅ guard against null

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

// Close Modal
export function closeModal() {
  if (!authPopup) return; // ✅ prevents null reference
  authPopup.classList.remove("show");
  authPopup.style.visibility = "hidden";
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

  if (!authPopup.classList.contains("show")) return;

  const identifier = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  if (!identifier || !password) {
    alert("Please enter both username/email and password");
    return;
  }

  login(identifier, password);

  document.getElementById("loginUsername").value = "";
  document.getElementById("loginPassword").value = "";

  if (document.getElementById("rememberMe").checked) {
    localStorage.setItem("savedAccount", identifier);
  }

  const savedAccount = localStorage.getItem("savedAccount");
  if (savedAccount) {
    const clean = savedAccount.trim();
    document.getElementById("loginUsername").value = clean;
  }
});

export function showToast(message, icon = "person") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");
  const toastIcon = toast.querySelector(".toast-icon");

  if (!toast || !toastMessage || !toastIcon) return;

  toastMessage.textContent = message;
  toastIcon.textContent = icon;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

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

export async function loadProfileFavorites() {
  const token = localStorage.getItem("token");
  const res = await fetch("http://localhost:5000/api/favorites", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  // Use displayFavorites instead of undefined renderFavorites
  displayFavorites("favoritesGrid", true);
}

document.addEventListener("DOMContentLoaded", () => {
  const openBtn = document.getElementById("openAvatarModal");
  const fileInput = document.getElementById("avatarFileInput");
  const closeBtn = document.getElementById("closeAvatarModal");
  const cancelBtn = document.getElementById("cancelAvatarBtn");
  const saveBtn = document.getElementById("saveAvatarBtn");
  const cropArea = document.getElementById("cropArea");
  let cropper;

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      fileInput.click();
    });
  }

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      document.getElementById("avatarModal").classList.add("show");

      const img = document.createElement("img");
      img.src = reader.result;
      cropArea.innerHTML = "";
      cropArea.appendChild(img);

      cropper = new window.Cropper(img, {
        aspectRatio: 1,
        viewMode: 1,
        autoCropArea: 1,
        responsive: true,
        movable: true,
        zoomable: true,
      });
    };
    reader.readAsDataURL(file);
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      document.getElementById("avatarModal").classList.remove("show");
      if (cropper) {
        cropper.destroy();
        cropper = null;
      }
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      document.getElementById("avatarModal").classList.remove("show");
      if (cropper) {
        cropper.destroy();
        cropper = null;
      }
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      if (!cropper) {
        showToast("No image selected to crop", "error");
        return;
      }

      const canvas = cropper.getCroppedCanvas({ width: 200, height: 200 });
      if (!canvas) {
        showToast("Crop failed", "error");
        return;
      }

      canvas.toBlob((blob) => {
        if (!blob) {
          showToast("Could not create image blob", "error");
          return;
        }

        const formData = new FormData();
        formData.append("avatar", blob, "avatar.png");

        const token = localStorage.getItem("token");
        fetch("http://localhost:5000/api/profile/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.error) {
              showToast("Upload failed: " + data.error, "error");
              return;
            }

            // ✅ Update userProfile object
            if (userProfile) {
              userProfile.profileImage = data.profileImage;
            }

            // ✅ Update DOM immediately
            const profileImg = document.getElementById("profileImage");
            if (profileImg) {
              profileImg.src = data.profileImage;
            }
            document.querySelector(".profile-avatar").src = data.profileImage;

            // ✅ Close modal
            document.getElementById("avatarModal").classList.remove("show");

            // ✅ Refresh into Profile page instead of Home
            showProfilePage();
            updateUI();

            showToast("Profile image updated!", "person");
          })

          .catch((err) => {
            console.error("Upload error:", err);
            showToast("Upload failed", "error");
          });
      }, "image/png");
    });
  }
});
