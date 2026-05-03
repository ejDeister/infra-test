function formValidate(beer, spans) {
    let isValid = true;

    if (!name(beer.get("name"), spans.name)) {
        isValid = false;
    }
    if (!type(beer.get("type"), spans.type)) {
        isValid = false;
    }
    if (!rating(beer.get("rating"), spans.rating)) {
        isValid = false;
    }
    if (!image(document.getElementById("image"), spans.image)) {
        isValid = false;
    }

    return isValid;
}

function name(name, nameValid) {
    if (!name) {
        nameValid.textContent = "Name is required";
        return false;
    } else {
        nameValid.textContent = "";
        return true;
    }
}

function type(type, typeValid) {
    if (!type) {
        typeValid.textContent = "Type is required";
        return false;
    } else {
        typeValid.textContent = "";
        return true;
    }
}

function rating(rating, ratingValid) {
    if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
        ratingValid.textContent =
            "Rating is required and must be a number between 1 and 5";
        return false;
    } else {
        ratingValid.textContent = "";
        return true;
    }
}

function image(upload, imageValid) {
    const image = upload.files[0];

    if (image) {
        const types = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/heic",
            "image/heif",
        ];
        if (!types.includes(image.type)) {
            imageValid.innerText =
                "Invalid file type. Allowed types: JPEG, PNG, GIF, HEIC, HEIF.";
            return false;
        } else {
            imageValid.innerText = "";
            return true;
        }
    }
    return true;
}

export default {
    name,
    type,
    rating,
    image,
    formValidate,
};
