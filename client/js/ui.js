async function getFavorites() {
  const token = localStorage.getItem("token");
  if (!token) return [];
  const res = await fetch("http://localhost:5000/api/favorites", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.favorites || [];
}

function displayGifs(gifs, favorites, isSearch = false, query = "") {
  lastDisplayedGifs = gifs;
  const featureHeader = document.querySelector(".feature-header");

  if (featureHeader) {
    featureHeader.textContent = query
      ? `Search Results for ${query}`
      : "Feature GIFs";
  }

  const resultContainer = document.getElementById("gifResults");
  if (!resultContainer) return;

  // Clear previous results
  resultContainer.innerHTML = "";
  const loadMoreBtn = document.getElementById("loadMoreBtn");

  if (!gifs || gifs.length === 0) {
    if (loadMoreBtn) loadMoreBtn.style.display = "none";
    const message = document.createElement("div");
    message.className = "no-results";
    message.textContent = "No GIFs Found. Try Another Search!";
    resultContainer.appendChild(message);
    return;
  }

  // Render GIFs
  gifs.forEach((gif) => {
    const imgUrl =
      gif.images?.fixed_height?.url ||
      gif.images?.downsized?.url ||
      gif.images?.original?.url;

    if (!imgUrl) return;

    const gifWrapper = document.createElement("div");
    gifWrapper.className = "gif-item";

    const img = document.createElement("img");
    img.src = imgUrl;
    img.alt = gif.title || "GIF";

    if (userProfile) {
      const favButton = document.createElement("button");
      favButton.className = "fav-btn";

      // ✅ Use favorites passed in as argument
      const isFavorited = favorites.includes(gif.id);

      favButton.textContent = isFavorited ? "❤️" : "🤍";
      if (isFavorited) favButton.classList.add("active");

      favButton.addEventListener("click", () => toggleFavorite(gif));
      gifWrapper.appendChild(favButton);
    }

    gifWrapper.appendChild(img);
    resultContainer.appendChild(gifWrapper);
  });

  // Masonry refresh if used
  if (typeof Masonry !== "undefined") {
    new Masonry(resultContainer, {
      itemSelector: ".gif-item",
      gutter: 15,
      fitWidth: true,
    });
  }
}

async function displayProfileSearchResults(gifs, favorites, query = "") {
  // reset state when new query
  if (query !== profileSearchState.query) {
    profileSearchState.query = query;
    profileSearchState.offset = 0;
  }

  const header = document.getElementById("profileFeatureHeader");
  if (header)
    header.textContent = query ? `Search Results for ${query}` : "Profile GIFs";

  const grid = document.getElementById("profileGifResults");
  const loadMoreBtn = document.getElementById("profileLoadMoreBtn");
  const spinner = document.getElementById("profileLoadingSpinner");

  if (!grid) return;

  // If offset is zero, replace content; otherwise we append
  if (profileSearchState.offset === 0) grid.innerHTML = "";

  // No results
  if (!gifs || gifs.length === 0) {
    if (profileSearchState.offset === 0) {
      grid.innerHTML = "";
      const message = document.createElement("div");
      message.className = "no-results";
      message.textContent = "No GIFs Found. Try Another Search!";
      grid.appendChild(message);
    }
    loadMoreBtn.style.display = "none";
    return;
  }

  // Render GIFs
  gifs.forEach((gif) => {
    const imgUrl =
      gif.images?.fixed_height?.url ||
      gif.images?.downsized?.url ||
      gif.images?.original?.url;
    if (!imgUrl) return;

    const gifWrapper = document.createElement("div");
    gifWrapper.className = "gif-item";

    const img = document.createElement("img");
    img.src = imgUrl;
    img.alt = gif.title || "GIF";

    // Favorite button (backend-aware)
    if (userProfile) {
      const favButton = document.createElement("button");
      favButton.className = "fav-btn";

      // ✅ Use backend favorites passed in
      const isFavorited = favorites.some((fav) => fav.id === gif.id);

      favButton.textContent = isFavorited ? "❤️" : "🤍";
      if (isFavorited) favButton.classList.add("active");

      favButton.addEventListener("click", () => toggleFavorite(gif));
      gifWrapper.appendChild(favButton);
    }

    gifWrapper.appendChild(img);
    grid.appendChild(gifWrapper);
  });

  // Show Load More if we got a full page
  if (gifs.length >= profileSearchState.limit) {
    loadMoreBtn.style.display = "block";
  } else {
    loadMoreBtn.style.display = "none";
  }

  // Wire Load More (idempotent)
  loadMoreBtn.onclick = async () => {
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = "Loading...";
    spinner.style.display = "block";

    try {
      profileSearchState.offset += profileSearchState.limit;
      const res = await fetchGifs(
        profileSearchState.query,
        profileSearchState.offset,
        profileSearchState.limit,
      );
      const newFavorites = await getFavorites(); // ✅ fetch backend favorites
      displayProfileSearchResults(
        res.data || [],
        newFavorites,
        profileSearchState.query,
      );
    } catch (err) {
      console.error("Profile Load More failed", err);
    } finally {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = "Load More GIFs";
      spinner.style.display = "none";
    }
  };

  // Masonry refresh if used
  const masonryTarget = document.getElementById("profileGifResults");
  if (typeof Masonry !== "undefined" && masonryTarget) {
    new Masonry(masonryTarget, {
      itemSelector: ".gif-item",
      gutter: 15,
      fitWidth: true,
    });
  }
}
