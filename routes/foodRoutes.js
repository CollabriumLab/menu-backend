import express from 'express';
import upload from '../middleware/upload.js';
import { 
  createFood, 
  getAllFoods, 
  getFoodById, 
  updateFood, 
  deleteFood 
} from '../controller/foodController.js';

const router = express.Router();

// POST /api/foods - Create a new food item with optional image
router.post('/', upload.single('image'), createFood);

// GET /api/foods - Get all food items
router.get('/', getAllFoods);

// GET /api/foods/:id - Get a single food item by ID
router.get('/:id', getFoodById);

// PUT /api/foods/:id - Update a food item with optional image
router.put('/:id', upload.single('image'), updateFood);

// DELETE /api/foods/:id - Delete a food item
router.delete('/:id', deleteFood);

export default router;
