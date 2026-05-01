import validate from './validation.js';

window.onload = function() {    
    const form = document.getElementById("newBeerForm");
    form.addEventListener("submit", validateForm); 
}

function validateForm(event){
    event.preventDefault();
    const beer = new FormData(event.target);
    let spans = getFormSpans(event.target);
    let isValid = validate.formValidate(beer, spans);

    if(isValid){
        addBeer(beer);
    }
}

function getFormSpans(form){
    return {
        name: form.querySelector("#nameValid"),
        type: form.querySelector("#typeValid"),
        rating: form.querySelector("#ratingValid"),
        image: form.querySelector("#imageValid")
    };
}

async function addBeer(newBeer){    
    console.log("reached addBeer");
    const config = {
        method:"post",
        mode: "cors",
        body: newBeer
    }
    const response = await fetch('/addBeer', config);

    console.log(response);

    //TO DO:
    //handle response
    if(response.ok){
        alert('Beer added successfully');
        window.location.href = 'index.html';
    }
    else{
        alert('Failed to add beer. Please try again.');
    }
}

// function validate(event){
//     event.preventDefault();
//     const newBeer = new FormData(event.target);
//     const validator = new Validate();

//     if(validator.validate(newBeer))  
//         {
//             console.log("All validations passed");
//             addBeer(newBeer);
//         }
//     else{
//         return;
//     }
// }
