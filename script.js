const API_KEY = "HWjUB90d31Rn3R81AZn7AEIsGSnjEYCr";

const gifGallery = document.getElementById('gifGallery');
const searchBar = document.getElementById('searchBar');


function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

async function loadTrendingGifs() {
const response = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${API_KEY}&limit=25&rating=pg-13`);

const data = await response.json();
displayGifs(data.data);
}



function displayGifs(gifs) {
const resultContainer = document.getElementById("gifResults");
resultContainer.innerHTML = "";
gifs.forEach(gif => {

    const imgUrl = gif.images?.fixed_height?.url 
                    || gif.images?.downsized?.url 
                    || gif.images?.original?.url;

    if (imgUrl) {
    const img = document.createElement("img");
    img.src = imgUrl;
    img.alt = gif.title || "GIF";
    resultContainer.appendChild(img);
    } else {
        const placeholder = document.createElement("div");
        placeholder.textContent = "GIF not available";
        resultContainer.appendChild(placeholder);
    }
});
}

loadTrendingGifs();


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
            resultContainer.textContent = "No GIF's found. Try another search!";
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


searchBar.addEventListener("input", debounce(handleSearch, 500));
