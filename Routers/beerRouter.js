import express from "express";
import controller from "../controllers/beerController.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: 'public/img/' });

router.get("/topBeers", controller.topBeers);
router.get("/allBeers", controller.allBeers);
router.post("/addBeer", upload.single("image"), controller.addBeer);
router.get("/getBeer/:id", controller.getBeer);
router.post("/editBeer", upload.single("image"), controller.editBeer);
router.delete("/deleteBeer/:id", controller.deleteBeer);

export default router;