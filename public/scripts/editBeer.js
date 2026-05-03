import { initDb, getBeerById, editBeer, commitDb } from "../../Models/datalayer.js";
import { s3Command } from "../../Models/utils.js";
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
    const urlParams = new URLSearchParams(window.location.search);
    const beerId = urlParams.get("id");

    await initDb();

    const editForm = document.getElementById("editBeerForm");
    editForm.addEventListener("submit", validateForm);

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

function fillFormData(beerId) {
    if (!beerId) {
        alert("Error: Can't find beer");
        window.location.href = "./index.html";
        return;
    }

    const beer = getBeerById(beerId);

    if (!beer) {
        alert("Beer not found");
        window.location.href = "./index.html";
        return;
    }

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
}

async function submitEditBeer(formData) {
    const imageFile = formData.get("image");
    let imageKey = null;

    if (imageFile && imageFile.size > 0) {
        const { url, key } = await s3Command("put", imageFile.name);
        await fetch(url, { method: "PUT", body: imageFile });
        imageKey = key;
    }

    const beer = {
        id: formData.get("beerId"),
        name: formData.get("name"),
        type: formData.get("type"),
        brewery: formData.get("brewery"),
        description: formData.get("description"),
        location: formData.get("location"),
        rating: formData.get("rating"),
        image: imageKey,
        updatedDate: new Date().toLocaleDateString("en-CA"),
    };

    try {
        await editBeer(beer);
        await commitDb();
        alert("Beer updated successfully");
        window.location.href = "index.html";
    } catch (err) {
        console.error("Edit beer failed", err);
        alert("Failed to update beer. Please try again.");
    }
}
