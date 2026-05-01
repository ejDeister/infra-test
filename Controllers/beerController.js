import datalayer from '../models/datalayer.js';
import multer from "multer";


const allBeers = async (req, res) => {
    const allBeers = await datalayer.getAllBeers();
    res.status(200).send(allBeers);
}

const getBeer = (req, res) => {
    const beerId = req.params.id;
    const result = datalayer.getBeerById(beerId);

    res.send(result);
}

const topBeers = async (req, res) => {
    const topBeers = await datalayer.getTopBeers();
    res.status(200).send(topBeers);
}

const addBeer = async (req, res) => {
    const isValid = validate(req.body, req.file);

    if(!isValid){
        res.status(400).send('Invalid beer data');
    }
    else{
        const beer = req.body;
        beer.image = req.file ? req.file.filename : "placeholder.png";

        beer.date = new Date().toLocaleDateString('en-CA');
        
        const result = await datalayer.addBeer(beer);
        res.send(result);
    }
}

const editBeer = (req, res) => {
    const isValid = validate(req.body, req.file);

    if(!isValid){
        res.status(400).send('Invalid beer data');
    }
    else {
        const beer = req.body;
        beer.updatedDate = new Date().toLocaleDateString('en-CA');

        //check if new image is provided
        if(req.file){
            beer.image = req.file.filename;
        }

        //send to datalayer
        const result = datalayer.editBeer(beer);

        //handle response
        if(!result){
            res.status(404).send('Update Beer failed');
        } 
        else {
            res.send(result);
        }
    }
}

const deleteBeer = async (req, res) => {
    const id = req.params.id;

    if(!id || id < 1 || isNaN(id)){
        res.status(400).send({ok: false, message: 'Invalid beer id'});
        return;
    }

    const response = await datalayer.deleteBeer(id);

    if(!response.ok){
        res.status(404).send({ok: false, message: response.message || 'Cannot delete from database'});
        return;
    }

    res.send(response);
}

function validate(beer, file){
    const types = ['image/jpeg', 'image/png', 'image/gif', 'image/heic', 'image/heif'];

    return beer.name && beer.type && beer.rating
           && !isNaN(beer.rating) && beer.rating >= 1 && beer.rating <= 5
           && (file ? types.includes(file.mimetype) : true);
}

export default{
    allBeers,
    addBeer,
    getBeer,
    editBeer,
    deleteBeer,
    topBeers
}