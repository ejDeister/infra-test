import express from 'express';``
import beerRouter from "./routers/beerRouter.js";
import cors from 'cors';

const app = express();

app.use(cors({origin: "*"}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', beerRouter);
app.use(express.static('public'));
app.use('/public', express.static('public'));
app.use('/img', express.static('public/img'));

app.use((req, res) => {
    res.status(404).send("Page not found");
})
app.listen(3000, "0.0.0.0", () => console.log("Listening on LAN"));