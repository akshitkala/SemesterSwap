const sharp = require('sharp');

/**
 * Compresses an image:
 * - Checks dimensions (max 5000px)
 * - Resizes to max width 800px
 * - Converts to WebP (quality 75)
 * - Strips metadata
 * - Logs size reduction
 * 
 * @param {Buffer} buffer - Original image buffer
 * @param {string} filename - Original filename for logging
 * @returns {Promise<Buffer>} - Compressed image buffer
 */
const compressImage = async (buffer, filename) => {
  try {
    // 1. Validate Dimensions
    const metadata = await sharp(buffer).metadata();

    if (metadata.width > 5000 || metadata.height > 5000) {
      throw new Error('Image dimensions too large (max 5000x5000)');
    }

    const startSize = (buffer.length / 1024).toFixed(2); // KB

    // 2. Compress & Resize
    const compressedBuffer = await sharp(buffer)
      .resize({
        width: 800,
        fit: 'inside', // Maintain aspect ratio
        withoutEnlargement: true, // Don't upscale small images
      })
      .webp({ quality: 75 }) // Convert to WebP
      // .strip() // Remove metadata - defaulting to strip?
      .toBuffer();

    const endSize = (compressedBuffer.length / 1024).toFixed(2); // KB

    // 3. Log Results
    console.log(`[Image Compression] ${filename}: ${startSize}KB -> ${endSize}KB`);

    return compressedBuffer;
  } catch (error) {
    console.error(`[Compression Error] ${filename}:`, error);
    throw error; // Re-throw to be handled by controller
  }
};

module.exports = { compressImage };
