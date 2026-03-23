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
const response = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${API_KEY}&limit=25&rating=pg-13`);

const data = await response.json();
displayGifs(data.data);
}


async function handleSearch(event) {
    const query = event.target.value.trim();
    const resultContainer = document.getElementById("gifResults");
    const spinner = document.getElementById("loadingSpinner");

    resultContainer.innerHTML = "";
    if (spinner) spinner.style.display = "block"

    try {
        let response;
        if (!query) {
            response = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${API_KEY}&limit=25&rating=pg-13`);
        } else {
            response = await fetch (`https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=pg-13`);
        }

        const data = await response.json();
        if (!query) {
            displayGifs(data.data);
        }else if (!data.data || data.data.length === 0) {
            resultContainer.innerHTML = ""
            
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
        console.error("Error fetching GIF's",error);
    } finally {
        if (spinner) spinner.style.display = "none";
    }
    }


// 3. Display
function displayGifs(gifs) {
lastDisplayedGifs = gifs;

const resultContainer = document.getElementById("gifResults");
resultContainer.innerHTML = "";
gifs.forEach(gif => {

    const imgUrl = gif.images?.fixed_height?.url 
                    || gif.images?.downsized?.url 
                    || gif.images?.original?.url;

    if (imgUrl) {
    const gifWrapper = document.createElement("div");
    gifWrapper.className = "gif-item";

    const img = document.createElement("img");
    img.src = imgUrl;
    img.alt = gif.title || "GIF";

    const favButton = document.createElement("button");
    favButton.className = "fav-btn";

    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const isFavorited = favorites.some(fav => fav.id === gif.id);
    if (isFavorited) {
        favButton.classList.add("active");
        favButton.textContent = "❤️";
    } else {
        favButton.textContent = "🤍";
    }


    favButton.textContent = isFavorited ? "❤️" : "🤍";
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
        const img = document.createElement("img");
        img.src = gif.images.fixed_height.url;
        img.alt = gif.title || "Favorite GIF";
        favContainer.appendChild(img);
        })
}


// 4. Interactions
function toggleFavorite(gif) {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const exists = favorites.find(fav => fav.id === gif.id);

    if (exists) {
        favorites = favorites.filter(fav => fav.id !== gif.id);
    } else {
        favorites.push(gif);
    }

    localStorage.setItem("favorites", JSON.stringify(favorites));
    displayFavorites();


        displayGifs(lastDisplayedGifs);
}



// 5. Event Listeners
loadTrendingGifs();
displayFavorites();
searchBar.addEventListener("input", debounce(handleSearch, 500));
