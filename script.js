const API_KEY = "HWjUB90d31Rn3R81AZn7AEIsGSnjEYCr";

const gifGallery = document.getElementById('gifGallery');
const searchBar = document.getElementById('searchBar');

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

searchBar.addEventListener('input', async() => {
    const query = searchBar.value.trim();

    if (query.length > 2) {
        try {
            const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${query}&limit=20&rating=r`);
            const data = await response.json();
            displayGifs(data.data);
        } catch (error) {
            console.error("Error fetching search GIF's", error);
        }
    } else {
        loadTrendingGifs();
    }
});

