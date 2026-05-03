import { initDb, addBeer, commitDb } from "../../Models/datalayer.js";
import { s3Command } from "../../Models/utils.js";
import validate from "./validation.js";

window.onload = async () => {
    await initDb();
    const form = document.getElementById("newBeerForm");
    form.addEventListener("submit", validateForm);
};

function validateForm(event) {
    event.preventDefault();
    const beer = new FormData(event.target);
    let spans = getFormSpans(event.target);
    let isValid = validate.formValidate(beer, spans);

    if (isValid) {
        addBeerHandler(beer);
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

async function addBeerHandler(formData) {
    const imageFile = formData.get("image");
    let imageKey = "placeholder.png";

    if (imageFile && imageFile.size > 0) {
        const { url, key } = await s3Command("put", imageFile.name);
        await fetch(url, { method: "PUT", body: imageFile });
        imageKey = key;
    }

    const beer = {
        name: formData.get("name"),
        type: formData.get("type"),
        brewery: formData.get("brewery"),
        description: formData.get("description"),
        location: formData.get("location"),
        rating: formData.get("rating"),
        image: imageKey,
        date: new Date().toLocaleDateString("en-CA"),
    };

    try {
        await addBeer(beer);
        await commitDb();
        alert("Beer added successfully");
        window.location.href = "index.html";
    } catch (err) {
        console.error("Add beer failed", err);
        alert("Failed to add beer. Please try again.");
    }
}
