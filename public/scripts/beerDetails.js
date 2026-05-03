window.onload = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const beerId = urlParams.get("id");

    if (!beerId) {
        alert("Error: Can't find beer");
        window.location.href = "./index.html";
        return;
    }

    await loadBeerDetails(beerId);
};

async function loadBeerDetails(beerId) {
    try {
        const response = await fetch(`/getBeer/${beerId}`);

        if (!response.ok) {
            throw new Error("Beer not found");
        }

        const beer = await response.json();

        // Populate beer details
        document.getElementById("beerName").textContent = beer.name || "";
        document.getElementById("beerRating").textContent = beer.rating || "";
        document.getElementById("beerType").textContent = beer.type || "";
        document.getElementById("beerBrewery").textContent = beer.brewery || "";
        document.getElementById("beerDescription").textContent =
            beer.description || "";
        document.getElementById("beerLocation").textContent =
            beer.location || "";
        document.getElementById("beerDate").textContent = beer.date || "";

        // Set image with fallback
        const beerImage = document.getElementById("beerImage");
        setBeerImage(beerImage, beer.image, beer.name);

        // Store beer ID for edit/delete
        window.currentBeerId = beer.id;
    } catch (error) {
        console.error("Error loading beer details:", error);
        alert("Couldn't load beer details");
        window.location.href = "./index.html";
    }
}

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
            const response = await fetch(
                `/deleteBeer/${window.currentBeerId}`,
                {
                    method: "DELETE",
                },
            );

            if (response.ok) {
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
