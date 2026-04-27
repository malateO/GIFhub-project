function toggleFavorite(gif) {
  if (!userProfile) {
    alert("Please log in to save favorites!");
    return;
  }
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
  displayGifs(lastDisplayedGifs);
  displayFavorites("profileFavorites", "profile-gif");
}

function displayFavorites(containerId) {
  if (!userProfile) return;

  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  if (favorites.length === 0) {
    const message = document.createElement("div");
    message.className = "no-results";
    message.textContent = "No Favorites Yet!";
    container.appendChild(message);
    return;
  }

  favorites.forEach((gif) => {
    const gifWrapper = document.createElement("div");
    gifWrapper.className = "gif-item";

    const img = document.createElement("img");
    img.src = gif.images.fixed_height.url || gif.images?.downsized?.url;
    img.alt = gif.title || "Favorite GIF";

    const favButton = document.createElement("button");
    favButton.className = "fav-btn active";
    favButton.textContent = "❤️";

    // Allow removing directly from Favorites
    favButton.addEventListener("click", () => {
      toggleFavorite(gif);
      displayFavorites(containerId);
    });

    gifWrapper.appendChild(img);
    gifWrapper.appendChild(favButton);
    container.appendChild(gifWrapper);
  });
}
