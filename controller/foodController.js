import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Utility function to delete uploaded file
const deleteUploadedFile = (filename) => {
  try {
    if (!filename) return false;
    
    const filePath = path.join(__dirname, '../uploads/foods', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Deleted file: ${filename}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error deleting file:', error);
    return false;
  }
};

// Create a new food item
export const createFood = async (req, res) => {
  try {
    const { name, description, price, category, available } = req.body;
    
    // Validation
    if (!name || !price || !category) {
      // If validation fails and file was uploaded, delete it
      if (req.file) {
        deleteUploadedFile(req.file.filename);
        console.log(`🧹 Cleaned up uploaded file due to validation error: ${req.file.filename}`);
      }
      
      return res.status(400).json({ 
        error: 'Name, price, and category are required' 
      });
    }

    // Handle image URL
    let imageUrl = null;
    if (req.file) {
      // Create image URL for locally stored files
      imageUrl = `/api/uploads/foods/${req.file.filename}`;
    }

    // Convert string values to proper types
    const parsedPrice = parseFloat(price);
    const parsedAvailable = available !== undefined ? 
      (available === 'true' || available === true || available === 'True' || available === 'TRUE') : 
      true;

    console.log('Creating food with data:', {
      name,
      description,
      price: parsedPrice,
      category,
      imageUrl,
      available: parsedAvailable,
      availableOriginal: available,
      availableType: typeof available
    });

    const food = await prisma.food.create({
      data: {
        name,
        description,
        price: parsedPrice,
        category,
        imageUrl,
        available: parsedAvailable
      }
    });

    res.status(201).json({
      success: true,
      data: food,
      message: 'Food item created successfully'
    });
  } catch (error) {
    console.error('Create food error:', error);
    
    // If there was an uploaded file and database operation failed, delete the file
    if (req.file) {
      deleteUploadedFile(req.file.filename);
      console.log(`🧹 Cleaned up uploaded file due to database error: ${req.file.filename}`);
    }
    
    res.status(500).json({ 
      error: 'Failed to create food item',
      details: error.message 
    });
  }
};

// Get all food items
export const getAllFoods = async (req, res) => {
  try {
    const { category, available } = req.query;
    
    // Build filter object
    const where = {};
    if (category) where.category = category;
    if (available !== undefined) where.available = available === 'true';

    const foods = await prisma.food.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: foods,
      count: foods.length
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch food items',
      details: error.message 
    });
  }
};

// Get a single food item by ID
export const getFoodById = async (req, res) => {
  try {
    const { id } = req.params;

    const food = await prisma.food.findUnique({
      where: { id }
    });

    if (!food) {
      return res.status(404).json({ 
        error: 'Food item not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: food
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch food item',
      details: error.message 
    });
  }
};

// Update a food item
export const updateFood = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, available } = req.body;

    // Check if food exists
    const existingFood = await prisma.food.findUnique({
      where: { id }
    });

    if (!existingFood) {
      return res.status(404).json({ 
        error: 'Food item not found' 
      });
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (category !== undefined) updateData.category = category;
    if (available !== undefined) updateData.available = (available === 'true' || available === true);

    // Handle image update
    let oldImageFilename = null;
    if (req.file) {
      updateData.imageUrl = `/api/uploads/foods/${req.file.filename}`;
      
      // Store old image filename for cleanup if update succeeds
      if (existingFood.imageUrl) {
        oldImageFilename = existingFood.imageUrl.replace('/api/uploads/foods/', '');
      }
    }

    const updatedFood = await prisma.food.update({
      where: { id },
      data: updateData
    });

    // If update succeeded and there was an old image, delete it
    if (oldImageFilename && req.file) {
      deleteUploadedFile(oldImageFilename);
      console.log(`🧹 Cleaned up old image: ${oldImageFilename}`);
    }

    res.status(200).json({
      success: true,
      data: updatedFood,
      message: 'Food item updated successfully'
    });
  } catch (error) {
    // If update failed and new file was uploaded, delete the new file
    if (req.file) {
      deleteUploadedFile(req.file.filename);
      console.log(`🧹 Cleaned up uploaded file due to update error: ${req.file.filename}`);
    }
    
    res.status(500).json({ 
      error: 'Failed to update food item',
      details: error.message 
    });
  }
};

// Delete a food item
export const deleteFood = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if food exists
    const existingFood = await prisma.food.findUnique({
      where: { id }
    });

    if (!existingFood) {
      return res.status(404).json({ 
        error: 'Food item not found' 
      });
    }

    // Delete the food item from database
    await prisma.food.delete({
      where: { id }
    });

    // Delete associated image file if exists
    if (existingFood.imageUrl) {
      // Extract filename from URL
      const filename = existingFood.imageUrl.replace('/api/uploads/foods/', '');
      deleteUploadedFile(filename);
    }

    res.status(200).json({
      success: true,
      message: 'Food item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to delete food item',
      details: error.message 
    });
  }
};