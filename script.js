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
    gifGallery.innerHTML = gifs
    .map(gif => `<img src="${gif.images.fixed_height.url}"alt="${gif.title}">`)
    .join("")
}

loadTrendingGifs();

// searchBar.addEventListener('input', async() => {
//     const query = searchBar.value.trim();

//     if (query.length > 2) {
//         try {
//             const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${query}&limit=20&rating=r`);
//             const data = await response.json();
//             displayGifs(data.data);
//         } catch (error) {
//             console.error("Error fetching search GIF's", error);
//         }
//     } else {
//         loadTrendingGifs();
//     }
// });

async function handleSearch(event) {
    const query = event.target.value.trim();
    const resultContainer = document.getElementById("gifGallery");

    resultContainer.innerHTML = "";

    if(!query) {
        resultContainer.textContent = "Type something to search.....";
        return;
    }

    gifGallery.textContent = "Searching....";

    try {
        const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${query}&limit=20&rating=r`);
        const data = await response.json();
        displayGifs(data.data);
    } catch (error) {
        gifGallery.textContent = "Error fetching search Gif's"
        console.error("Error fetching search Gif's", error);
    }
}

searchBar.addEventListener("input", debounce(handleSearch, 500));
