import fs from 'fs';
import { db, s3 } from '../Lambda/setup.js';
import {
  sqlAll,
  sqlRun,
  sqlGet
} from './utils.js';

//to log all SQL queries when in development mode
//const db = new Database('./data/beers.db', { verbose: console.log });

export const getAllBeers = async () => {
    return sqlAll('SELECT * FROM beers ORDER BY date DESC');
}

export const getTopBeers = async () => {
    return sqlAll('SELECT * FROM beers ORDER BY rating DESC LIMIT 10');
}

export const addBeer = async (beer) => {
    const query = `
      INSERT INTO beers (
            name, type, brewery, description, 
            location, rating, image, date
      )
      VALUES (?,?,?,?,?,?,?,?)
    `;

    const params = [ 
      beer.name,
      beer.type,
      beer.brewery,
      beer.description,
      beer.location,
      beer.rating,
      beer.image,
      beer.date,
    ];

    return sqlRun(query, params);
}

export const getBeerById = (id) => {
    const query = `SELECT * FROM beers WHERE id = ?`;
    return sqlGet(query, [id])
}

export const editBeer = (beer) => {
    let result;

    //check if user has defined a new image
    if(beer.image){
        const existingImage = getImageById(beer.id);

        const query =  `
          UPDATE beers 
          SET name = ?, 
              type = ?,
              brewery = ?,
              description = ?,
              location = ?, 
              rating = ?,
              image = ?,
              updatedDate = ?
          WHERE id = ?
        `;
        const params = [ 
          beer.name,
          beer.type,
          beer.brewery,
          beer.description, 
          beer.location,
          beer.rating,
          beer.image,
          beer.updatedDate,
          beer.id,
        ];

        result = sqlRun(query,params);
        
        const image = beer.image || existingImage;

        // TODO: This should be handled by S3 now (DeleteObjectCommand)

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

export const getImageById = (id) => {
    const query = `SELECT image FROM beers WHERE id = ?`
    return sqlGet(query,[id]) ? image.image : null;
}

export default {
    getAllBeers,
    addBeer,
    getBeerById,
    editBeer,
    deleteBeer,
    getTopBeers
}
