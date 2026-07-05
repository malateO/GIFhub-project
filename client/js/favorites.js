import { userProfile, showToast } from "./auth.js";
import {
  initMasonry,
  getFavorites,
  displayProfileSearchResults,
  displayGifs,
  displayFavoritesSearch,
} from "./ui.js";
import {
  lastDisplayedGifs,
  currentSearchQuery,
  favoritesSearchActive,
} from "./state.js";

let favoritesState = {
  offset: 0,
  limit: 20,
};

export async function toggleFavorite(gif) {
  if (!userProfile) {
    alert("Please log in to save Favorites!");
    return;
  }

  const favorites = await getFavorites();
  const isFavorited = favorites.some((fav) => fav.id === gif.id);

  if (isFavorited) {
    await fetch(`http://localhost:5000/api/favorites/${gif.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    showToast("Removed from Favorites", "cancel");
  } else {
    await fetch("http://localhost:5000/api/favorites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        gifId: gif.id,
        title: gif.title,
        images: gif.images,
      }),
    });
    showToast("Added to Favorites", "favorite");
  }

  // ✅ No full grid refresh here — let the button handler flip the heart
}

export async function displayFavorites(containerId, reset = true) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!userProfile) {
    container.innerHTML =
      "<div class='no-results'>Log in to see Favorites</div>";
    return;
  }

  const token = localStorage.getItem("token");
  const res = await fetch("http://localhost:5000/api/favorites", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  const allFavorites = data.favorites || [];

  if (reset) {
    favoritesState.offset = 0;
    container.innerHTML = "";
  }

  // Slice favorites by batch
  const batch = allFavorites.slice(
    favoritesState.offset,
    favoritesState.offset + favoritesState.limit,
  );

  if (batch.length === 0 && favoritesState.offset === 0) {
    const message = document.createElement("div");
    message.className = "no-results";
    message.textContent = "No Favorites Yet!";
    container.appendChild(message);
    document.getElementById("favoritesLoadMoreBtn").style.display = "none";
    return;
  }

  batch.forEach((gif) => {
    const gifWrapper = document.createElement("div");
    gifWrapper.className = "gif-item";

    const img = document.createElement("img");
    img.src =
      gif.images?.fixed_height?.url ||
      gif.images?.downsized?.url ||
      gif.images?.original?.url;
    img.alt = gif.title || "Favorite GIF";

    const favButton = document.createElement("button");
    favButton.className = "fav-btn active";
    favButton.textContent = "❤️";

    favButton.addEventListener("click", async () => {
      await toggleFavorite(gif);

      // Flip the button instantly
      if (favButton.classList.contains("active")) {
        favButton.classList.remove("active");
        favButton.textContent = "🤍";
      } else {
        favButton.classList.add("active");
        favButton.textContent = "❤️";
      }
    });

    gifWrapper.appendChild(img);
    gifWrapper.appendChild(favButton);
    container.appendChild(gifWrapper);
  });

  // Masonry refresh
  initMasonry("favoritesGrid");

  // Show/hide Load More
  const btn = document.getElementById("favoritesLoadMoreBtn");
  if (btn) {
    if (favoritesState.offset + favoritesState.limit < allFavorites.length) {
      btn.style.display = "block";
    } else {
      btn.style.display = "none";
    }
  }
}

document
  .getElementById("favoritesLoadMoreBtn")
  .addEventListener("click", () => {
    favoritesState.offset += favoritesState.limit;
    displayFavorites("favoritesGrid", false);
  });
