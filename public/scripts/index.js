import { initDb, getAllBeers, deleteBeer, commitDb } from "../../Models/datalayer.js";

let allBeers = [];

window.onload = async () => {
    await initDb();
    const beers = getAllBeers();
    allBeers = beers;

    if (!beers || !Array.isArray(beers) || beers.length === 0) {
        noBeerAlert();
    } else {
        displayBeers(beers);

        const sort = document.getElementById("sort");
        sort.addEventListener("change", () => sortBy(allBeers, sort.value));

        const search = document.getElementById("search");
        search.addEventListener("input", () =>
            searchFor(allBeers, search.value),
        );
    }
};

function displayBeers(beers) {
    const ul = document.getElementById("favorite-beers");
    ul.innerHTML = "";

    beers.forEach((beer) => {
        //create elements
        const name = document.createElement("h3");
        name.innerText = beer.name;
        name.setAttribute("id", beer.id);

        const image = document.createElement("img");
        setBeerImage(image, beer.image, beer.name);
        image.alt = beer.name;
        // Add these lines to constrain image size:
        image.style.maxWidth = "200px";
        image.style.maxHeight = "200px";
        image.style.objectFit = "cover";
        image.style.display = "block";
        image.style.margin = "10px 0";

        const rating = document.createElement("span");
        rating.innerText = `Rating: ${beer.rating}/5`;

        const description = document.createElement("p");
        description.innerText = beer.description;

        const brewery = document.createElement("span");
        brewery.innerText = `Brewery: ${beer.brewery}`;

        const type = document.createElement("span");
        type.innerText = `Type: ${beer.type}`;

        const location = document.createElement("span");
        location.innerText = `Location: ${beer.location}`;

        const date = document.createElement("span");
        date.innerText = `Added on: ${beer.date}`;

        const details = document.createElement("a");
        details.href = `/beerDetails.html?id=${beer.id}`;
        details.innerText = "View Details";

        const editLink = document.createElement("a");
        editLink.href = `/editBeer.html?id=${beer.id}`;
        editLink.innerText = "Edit";
        editLink.style.marginLeft = "10px";

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.innerText = "Delete";
        deleteBtn.style.marginLeft = "10px";

        deleteBtn.onclick = async function (event) {
            event.preventDefault();
            if (!confirm(`Are you sure you want to delete ${beer.name}?`))
                return;
            try {
                const res = await deleteBeer(beer.id);
                if (res.ok) {
                    await commitDb();
                    alert("Beer deleted successfully");
                    window.location.href = "index.html";
                } else {
                    alert("Failed to delete beer. Please try again.");
                }
            } catch (err) {
                console.error("Delete failed", err);
                alert("Failed to delete beer. Please try again.");
            }
        };

        //line break
        const br = document.createElement("br");

        //append elements
        const li = document.createElement("li");
        li.style.maxWidth = "400px";
        li.style.border = "1px solid #ddd";
        li.style.padding = "15px";
        li.style.marginBottom = "20px";

        li.appendChild(name);
        li.appendChild(rating);
        li.appendChild(image);
        li.appendChild(description);
        li.appendChild(brewery);
        li.appendChild(type);
        li.appendChild(location);
        li.appendChild(date);
        li.appendChild(details);
        li.appendChild(editLink);
        li.appendChild(deleteBtn);
        li.appendChild(br);

        li.setAttribute("class", "beer-item");

        ul.appendChild(li);
    });
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

function sortBy(beers, sortOption) {
    let sortedBeers;

    switch (sortOption) {
        case "name":
            sortedBeers = beers.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case "rating":
            sortedBeers = beers.sort((a, b) => b.rating - a.rating);
            break;
        case "date asc":
            sortedBeers = beers.sort(
                (a, b) => new Date(a.date) - new Date(b.date),
            );
            break;
        case "date desc":
            sortedBeers = beers.sort(
                (a, b) => new Date(b.date) - new Date(a.date),
            );
            break;
        case "type":
            sortedBeers = beers.sort((a, b) => a.type.localeCompare(b.type));
            break;
        case "brewery":
            sortedBeers = beers.sort((a, b) =>
                a.brewery.localeCompare(b.brewery),
            );
            break;
        default:
            sortedBeers = beers;
    }

    displayBeers(sortedBeers);
}

function noBeerAlert() {
    const body = document.getElementById("favorite-beers");
    const message = document.createElement("h3");
    message.innerText = "NO BEERS!!!";
    body.appendChild(message);
}

function searchFor(beers, term) {
    let message = document.getElementById("searchMessage");
    const searchTerm = term.toLowerCase().trim();

    let filteredBeers = beers.filter(
        (beer) =>
            beer.name.toLowerCase().startsWith(searchTerm) ||
            beer.type.toLowerCase().startsWith(searchTerm) ||
            beer.brewery.toLowerCase().startsWith(searchTerm),
    );

    if (filteredBeers.length === 0) {
        message.innerText = "No results";
        document.getElementById("favorite-beers").innerHTML = "";
    } else {
        message.innerText = "";
        const currentSort = document.getElementById("sort").value;
        sortBy(filteredBeers, currentSort);
    }
}
