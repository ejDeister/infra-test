import fs from 'fs';
import Database from 'better-sqlite3';

//without logging SQL queries
const db = new Database('./data/beers.db');

//to log all SQL queries when in development mode
//const db = new Database('./data/beers.db', { verbose: console.log });

const getAllBeers = async () => {
    const result = db.prepare('SELECT * FROM beers ORDER BY date DESC');
    const allBeers = result.all();
    
    return allBeers;
}

const getTopBeers = async () => {
    const result = db.prepare('SELECT * FROM beers ORDER BY rating DESC LIMIT 10');
    const topBeers = result.all();

    return topBeers;
}

const addBeer = async (beer) => {
    const query = `INSERT INTO beers ( name, type, brewery, description, 
                                       location, rating, image, date
                                     )
                   VALUES (?,?,?,?,?,?,?,?)`;
    const prepare = db.prepare(query)
    const result = prepare.run( 
                                beer.name, beer.type, beer.brewery, beer.description, 
                                beer.location, beer.rating, beer.image, beer.date,
                              );
    
    return {...result, image: beer.image, id: result.lastInsertRowid};
}

const getBeerById = (id) => {
    const query = `SELECT * FROM beers WHERE id = ?`;

    const prepare = db.prepare(query);
    const beer = prepare.get(id);

    return beer;
}

const editBeer = (beer) => {
    let result;

    //check if user has defined a new image
    if(beer.image){
        const existingImage = getImageById(beer.id);

        const query =  `UPDATE beers 
                        SET name = ?, type = ?, brewery = ?, description = ?, location = ?, 
                           rating = ?, image = ?, updatedDate = ?
                        WHERE id = ?`;

        const prepare = db.prepare(query);
        result = prepare.run( 
                                beer.name, beer.type, beer.brewery, beer.description, 
                                beer.location, beer.rating, beer.image, beer.updatedDate,beer.id
                            );
        
        const image = beer.image || existingImage;

        //delete old image file if it's not the placeholder
        if(image != 'placeholder.png' && image != beer.image){
            fs.promises.unlink(`./public/img/${image}`);
        }

        return {...result, image: image, updatedDate: beer.updatedDate};
    }
    else{
        const query = `UPDATE beers 
                       SET name = ?, type = ?, brewery = ?, description = ?, location = ?, 
                           rating = ?, updatedDate = ?
                       WHERE id = ?`;

        const prepare = db.prepare(query);
        result = prepare.run( 
                                beer.name, beer.type, beer.brewery, beer.description, 
                                beer.location, beer.rating, beer.updatedDate, beer.id
                            );
        return {...result, updatedDate: beer.updatedDate};
    }
}

const deleteBeer = async (id) => {
    //fetchimage file
    const image = getImageById(id);

    //delete beer from database
    const query = `DELETE FROM beers WHERE id = ?`;
    const prepare = db.prepare(query);
    const runDelete = prepare.run(id);

    //remove image file if it's not the placeholder
    if(image && image != 'placeholder.png'){ 
        try{
            await fs.promises.unlink(`./public/img/${image}`);
        } 
        catch (error) {
            console.error('Error deleting image file:', error);
        }
    }

    if(runDelete.changes === 0){
        console.log(`No beer found with id ${id}`);
        return {ok: false, message: 'Beer not found'};
    }

    return {ok: true, message: 'Beer deleted successfully'};
}

const getImageById = (id) => {
    const query = `SELECT image FROM beers WHERE id = ?`
    const prepare = db.prepare(query);
    const image = prepare.get(id);

    return image ? image.image : null;
}

export default {
    getAllBeers,
    addBeer,
    getBeerById,
    editBeer,
    deleteBeer,
    getTopBeers
}