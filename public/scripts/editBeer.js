import validate from "./validation.js";

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
    //get beer id from url
    const urlParams = new URLSearchParams(window.location.search);
    const beerId = urlParams.get("id");

    //prepare form submission handler
    const editForm = document.getElementById("editBeerForm");
    editForm.addEventListener("submit", validateForm);

    //fill initial form data
    fillFormData(beerId);
};

function validateForm(event) {
    event.preventDefault();
    const beer = new FormData(event.target);
    let spans = getFormSpans(event.target);
    let isValid = validate.formValidate(beer, spans);

    if (isValid) {
        submitEditBeer(beer);
    }
}

function getFormSpans(form) {
    return {
        name: form.querySelector("#nameValid"),
        type: form.querySelector("#typeValid"),
        rating: form.querySelector("#ratingValid"),
        image: form.querySelector("#imageValid"),
    };
}

async function fillFormData(beerId) {
    if (!beerId) {
        alert("Error: Can't find beer");
        window.location.href = "./index.html";
        return;
    }

    try {
        // Fetch beer data from backend
        const response = await fetch(`/getBeer/${beerId}`);

        if (!response.ok) {
            throw new Error("Beer not found");
        }

        const beer = await response.json();

        // Populate form fields with existing data
        document.getElementById("beerId").value = beer.id || "";
        document.getElementById("name").value = beer.name || "";
        document.getElementById("type").value = beer.type || "";
        document.getElementById("brewery").value = beer.brewery || "";
        document.getElementById("description").value = beer.description || "";
        document.getElementById("location").value = beer.location || "";
        document.getElementById("rating").value = beer.rating || "";
        const currentImageElement = document.getElementById("currentImage");
        setBeerImage(currentImageElement, beer.image, beer.name);
        document.getElementById("date").innerHTML = beer.date || "";

        document.getElementById("submit").value = "Update Beer";
    } catch (error) {
        console.error("Error pouring beer:", error);
        alert("Couldn't pour this beer");
        window.location.href = "./index.html";
    }
}

async function submitEditBeer(editedBeer) {
    const config = {
        method: "POST",
        mode: "cors",
        body: editedBeer,
    };

    const result = await fetch("/editBeer", config);

    if (result.ok) {
        alert("Beer updated successfully");
        window.location.href = "index.html";
    } else {
        alert("Failed to update beer. Please try again.");
    }
}
