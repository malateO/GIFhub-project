let favoritesState = {
  offset: 0,
  limit: 20,
};

function toggleFavorite(gif) {
  if (!userProfile) {
    alert("Please log in to save favorites!");
    return;
  }

  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const exists = favorites.some((fav) => fav.id === gif.id);

  if (exists) {
    favorites = favorites.filter((fav) => fav.id !== gif.id);
  } else {
    favorites.push(gif);
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));

  // Refresh views to stay in sync
  displayGifs(lastDisplayedGifs);
  displayFavorites("profileFavorites");
  displayFavorites("favoritesGrid"); // <-- add this line
}

function showFavoritesPage() {
  document.getElementById("feature-section").style.display = "none";
  document.getElementById("profile").style.display = "none";
  document.getElementById("favorites").style.display = "block";

  displayFavorites("favoritesGrid");
}

function displayFavorites(containerId, reset = true) {
  if (!userProfile) return;

  const allFavorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const container = document.getElementById(containerId);
  if (!container) return;

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

    favButton.addEventListener("click", () => {
      toggleFavorite(gif);
      displayFavorites(containerId, true);
    });

    gifWrapper.appendChild(img);
    gifWrapper.appendChild(favButton);
    container.appendChild(gifWrapper);
  });

  // Masonry refresh
  if (containerId === "favoritesGrid") {
    const masonryTarget = document.getElementById("favoritesGrid");
    if (typeof Masonry !== "undefined" && masonryTarget) {
      const existing = Masonry.data(masonryTarget);
      if (existing) existing.destroy();

      new Masonry(masonryTarget, {
        itemSelector: ".gif-item",
        gutter: 15,
        fitWidth: true,
      });
    }
  }

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
