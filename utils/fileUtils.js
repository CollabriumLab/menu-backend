import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Delete a file from uploads directory
export const deleteUploadedFile = (imageUrl) => {
  try {
    if (!imageUrl || !imageUrl.startsWith('/api/uploads/')) {
      return false;
    }

    // Extract filename from URL
    const filename = imageUrl.replace('/api/uploads/', '');
    const filePath = path.join(__dirname, '../uploads', filename);

    // Check if file exists and delete it
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted file: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Get file info
export const getFileInfo = (filename) => {
  const filePath = path.join(__dirname, '../uploads/foods', filename);
  
  try {
    const stats = fs.statSync(filePath);
    return {
      exists: true,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message
    };
  }
};
