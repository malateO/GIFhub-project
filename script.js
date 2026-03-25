const API_KEY = "HWjUB90d31Rn3R81AZn7AEIsGSnjEYCr";

let lastDisplayedGifs = [];

const gifGallery = document.getElementById('gifGallery');
const searchBar = document.getElementById('searchBar');

// 1. Utility
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// 2. Fetching
async function loadTrendingGifs() {
    // Fetch trending GIFs from Giphy API
    const response = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${API_KEY}&limit=25&rating=pg-13`);
    const data = await response.json();
    displayGifs(data.data); // Display in gallery section
}

async function handleSearch(event) {
    const query = event.target.value.trim();
    const resultContainer = document.getElementById("gifResults");
    const spinner = document.getElementById("loadingSpinner");

    resultContainer.innerHTML = "";
    if (spinner) spinner.style.display = "block"; // Show spinner while loading

    try {
        let response;
        if (!query) {
            // Default to trending if search is empty
            response = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${API_KEY}&limit=25&rating=pg-13`);
        } else {
            // Search endpoint
            response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=pg-13`);
        }

        const data = await response.json();
        if (!query) {
            resultContainer.classList.add("grid");
            displayGifs(data.data);
        } else if (!data.data || data.data.length === 0) {
            // Show "no results" message
            resultContainer.classList.remove("grid");
            resultContainer.style.display = "flex";
            resultContainer.style.alignItems = "center";
            resultContainer.style.justifyContent = "center";
            resultContainer.style.minHeight = "200px";

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
        } else {
            displayGifs(data.data);
        }

    } catch (error) {
        resultContainer.textContent = "Error fetching GIF's";
        console.error("Error fetching GIF's", error);
    } finally {
        if (spinner) spinner.style.display = "none"; // Hide spinner
    }
}

// 3. Display
function displayGifs(gifs) {
    lastDisplayedGifs = gifs; // Save last displayed for refresh

    const resultContainer = document.getElementById("gifResults");
    resultContainer.innerHTML = "";
    gifs.forEach(gif => {
        const imgUrl = gif.images?.fixed_height?.url 
                    || gif.images?.downsized?.url 
                    || gif.images?.original?.url;

        if (imgUrl) {
            const gifWrapper = document.createElement("div");
            gifWrapper.className = "gif-item"; // Matches CSS grid layout

            const img = document.createElement("img");
            img.src = imgUrl;
            img.alt = gif.title || "GIF";

            const favButton = document.createElement("button");
            favButton.className = "fav-btn";

            const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
            const isFavorited = favorites.some(fav => fav.id === gif.id);

            // Toggle heart icon based on favorite status
            favButton.textContent = isFavorited ? "❤️" : "🤍";
            if (isFavorited) favButton.classList.add("active");

            favButton.addEventListener("click", () => toggleFavorite(gif));

            gifWrapper.appendChild(img);
            gifWrapper.appendChild(favButton);
            resultContainer.appendChild(gifWrapper);
        } else {
            const placeholder = document.createElement("div");
            placeholder.textContent = "GIF not available";
            resultContainer.appendChild(placeholder);
        }
    });
}

function displayFavorites() {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const favContainer = document.getElementById("favorites");
    favContainer.innerHTML = "";

    favorites.forEach(gif => {
        const gifWrapper = document.createElement("div");
        gifWrapper.className = "gif-item"; // Consistent with gallery

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
        favContainer.appendChild(gifWrapper);
    });
}

function displayProfileFavorites() {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const profileContainer = document.getElementById("profileFavorites");
    profileContainer.innerHTML = "";

    favorites.forEach(gif => {
        const gifWrapper = document.createElement("div");
        gifWrapper.className = "profile-gif"; // Profile-specific wrapper

        const img = document.createElement("img");
        img.src = gif.images.fixed_height.url;
        img.alt = gif.title || "Favorite GIF";

        const favButton = document.createElement("button");
        favButton.className = "fav-btn active";
        favButton.textContent = "❤️";

        // Toggle works here too
        favButton.addEventListener("click", () => toggleFavorite(gif));

        gifWrapper.appendChild(img);
        gifWrapper.appendChild(favButton);
        profileContainer.appendChild(gifWrapper);
    });
}

// 4. Interactions
function toggleFavorite(gif) {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const exists = favorites.find(fav => fav.id === gif.id);

    if (exists) {
        // Remove if already favorited
        favorites = favorites.filter(fav => fav.id !== gif.id);
    } else {
        // Add if not favorited
        favorites.push(gif);
    }

    localStorage.setItem("favorites", JSON.stringify(favorites));

    // Refresh all views to stay in sync
    displayFavorites();
    displayProfileFavorites();
    displayGifs(lastDisplayedGifs);
}

// 5. Event Listeners
loadTrendingGifs();          // Load initial gallery
displayFavorites();          // Show favorites on page load
displayProfileFavorites();   // Show profile favorites on page load
searchBar.addEventListener("input", debounce(handleSearch, 500)); // Search with debounce

