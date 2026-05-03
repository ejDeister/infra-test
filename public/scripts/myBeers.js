window.onload = async () => {
    //fetch all beers from backend
    const config = {
        method: "get",
        mode: "cors",
    };
    const response = await fetch("/allBeers", config);
    const beers = await response.json();
    displayBeers(beers);

    //handle sorting
    const sort = document.getElementById("sort");
    sort.onchange = () => sortBy(beers, sort.value);

    //handle searching
    const search = document.getElementById("search");
    search.addEventListener("input", () => searchFor(beers, search.value));
};

function displayBeers(beers) {
    const numBeers = document.getElementById("numBeers");
    numBeers.innerText = `(${beers.length})`;

    const ul = document.getElementById("all-beers");
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
        image.style.objectFit = "cover"; // Maintains aspect ratio while filling the space
        image.style.display = "block"; // Makes image a block element
        image.style.margin = "10px 0"; // Adds some spacing above/below

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

        const edit = document.createElement("a");
        edit.href = `/editBeer.html?id=${beer.id}`;
        edit.innerText = "Edit";
        edit.style.marginLeft = "10px";

        // delete button: call DELETE and redirect to home on success
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.innerText = "Delete";
        deleteBtn.style.marginLeft = "10px";

        deleteBtn.onclick = async function (event) {
            event.preventDefault();
            if (!confirm(`Are you sure you want to delete ${beer.name}?`))
                return;
            try {
                const res = await fetch(`/deleteBeer/${beer.id}`, {
                    method: "DELETE",
                });
                if (res.ok) {
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
        li.style.maxWidth = "400px"; // Constrain overall width
        li.style.border = "1px solid #ddd"; // Optional: visual boundary
        li.style.padding = "15px"; // Optional: internal spacing
        li.style.marginBottom = "20px"; // Space between beer entries

        li.appendChild(name);
        li.appendChild(rating);
        li.appendChild(image);
        li.appendChild(description);
        li.appendChild(brewery);
        li.appendChild(type);
        li.appendChild(location);
        li.appendChild(date);
        li.appendChild(details);
        li.appendChild(edit);
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
        case "rating": //default sort for home page
            sortedBeers = beers.sort((a, b) => b.rating - a.rating);
            break;
        case "date asc": // default sort for myBeers page
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
        document.getElementById("all-beers").innerHTML = "";
    } else {
        message.innerText = "";
        displayBeers(filteredBeers);
    }
}
