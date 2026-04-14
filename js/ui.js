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
      if (userProfile) {
        const favButton = document.createElement("button");
        favButton.className = "fav-btn";

        const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
        const isFavorited = favorites.some((fav) => fav.id === gif.id);

        favButton.textContent = isFavorited ? "❤️" : "🤍";
        if (isFavorited) favButton.classList.add("active");

        favButton.addEventListener("click", () => toggleFavorite(gif));
        gifWrapper.appendChild(favButton);
      }

      gifWrapper.appendChild(img);
      resultContainer.appendChild(gifWrapper);
    }
  });
}

function showError(message) {
  const resultContainer = document.getElementById("gifResults");
  resultContainer.innerHTML = "";
  const errorCard = document.createElement("div");
  errorCard.className = "no-results";
  errorCard.textContent = message;

  resultContainer.appendChild(errorCard);
}
