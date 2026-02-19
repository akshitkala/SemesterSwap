const User = require('../models/User');
const Book = require('../models/Book');

// @desc    Get public user profile by ID
// @route   GET /api/users/:id
// @access  Protected
const getUserProfile = async (req, res, next) => {
  try {
    const id = req.params.id.trim();
    
    const user = await User.findOne({ _id: id }).select('displayName photoURL createdAt role isActive');
    
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Get user's active listings
    const listings = await Book.find({ 
      seller: req.params.id, 
      isDeleted: false, 
      status: 'approved' 
    })
    .sort({ createdAt: -1 })
    .select('bookName price condition subject images createdAt');

    // Return safe data
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role,
        createdAt: user.createdAt,
        isActive: user.isActive,
        listings
      }
    });

  } catch (error) {
    console.error('Error in getUserProfile:', error);
    next(error);
  }
};

module.exports = {
  getUserProfile,
};
