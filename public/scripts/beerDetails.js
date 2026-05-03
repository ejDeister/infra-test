import { initDb, getBeerById, deleteBeer, commitDb } from "../../Models/datalayer.js";

function setBeerImage(image, beerImage, beerName) {
    const placeholder = "/img/placeholder.png";
    const imagePath = beerImage
        ? `/img/${encodeURIComponent(beerImage)}`
        : placeholder;

    image.onerror = () => {
        image.onerror = null;
        image.src = placeholder;
    };

    image.src = imagePath;
    image.alt = beerName;
}

window.onload = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const beerId = urlParams.get("id");

    if (!beerId) {
        alert("Error: Can't find beer");
        window.location.href = "./index.html";
        return;
    }

    await initDb();
    loadBeerDetails(beerId);
};

function loadBeerDetails(beerId) {
    const beer = getBeerById(beerId);

    if (!beer) {
        alert("Couldn't load beer details");
        window.location.href = "./index.html";
        return;
    }

    document.getElementById("beerName").textContent = beer.name || "";
    document.getElementById("beerRating").textContent = beer.rating || "";
    document.getElementById("beerType").textContent = beer.type || "";
    document.getElementById("beerBrewery").textContent = beer.brewery || "";
    document.getElementById("beerDescription").textContent = beer.description || "";
    document.getElementById("beerLocation").textContent = beer.location || "";
    document.getElementById("beerDate").textContent = beer.date || "";

    const beerImage = document.getElementById("beerImage");
    setBeerImage(beerImage, beer.image, beer.name);

    window.currentBeerId = beer.id;
}

window.editBeer = function () {
    if (window.currentBeerId) {
        window.location.href = `/editBeer.html?id=${window.currentBeerId}`;
    }
};

window.deleteBeer = async function () {
    if (!window.currentBeerId) {
        alert("Error: Can't find beer");
        return;
    }

    if (confirm("Are you sure you want to delete this beer?")) {
        try {
            const response = await deleteBeer(window.currentBeerId);
            if (response.ok) {
                await commitDb();
                alert("Beer deleted successfully");
                window.location.href = "./index.html";
            } else {
                alert("Failed to delete beer. Please try again.");
            }
        } catch (error) {
            console.error("Error deleting beer:", error);
            alert("Failed to delete beer");
        }
    }
};
