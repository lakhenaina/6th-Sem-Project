import express from 'express';
import Rating from '../model/rating_model.js';
import { getRecommendations, getSimilarProducts } from '../services/collaborativeFiltering.js';

const router = express.Router();

/**
 * @route GET /api/recommendations/:userId
 * @desc Get personalized product recommendations using collaborative filtering
 * @param {string} userId - The user ID
 * @param {number} limit - Number of recommendations (default: 5)
 */
router.get('/recommendations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    const recommendations = await getRecommendations(userId, limit);

    res.status(200).json({
      success: true,
      userId,
      recommendedProducts: recommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recommendations',
      error: error.message
    });
  }
});

/**
 * @route GET /api/similar-products/:productId
 * @desc Get products similar to a given product based on user ratings
 * @param {string} productId - The product ID
 * @param {number} limit - Number of similar products (default: 5)
 */
router.get('/similar-products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    const similarProducts = await getSimilarProducts(productId, limit);

    res.status(200).json({
      success: true,
      productId,
      similarProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching similar products',
      error: error.message
    });
  }
});

/**
 * @route POST /api/ratings
 * @desc Add or update a product rating
 * @body {string} userId - The user ID
 * @body {string} productId - The product ID
 * @body {number} rating - Rating value (1-5)
 * @body {string} review - Optional review text
 */
router.post('/ratings', async (req, res) => {
  try {
    const { userId, productId, rating, review } = req.body;

    // Validate inputs
    if (!userId || !productId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, productId, rating'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if rating already exists
    let existingRating = await Rating.findOne({ user: userId, product: productId });

    if (existingRating) {
      // Update existing rating
      existingRating.rating = rating;
      existingRating.review = review || '';
      await existingRating.save();

      return res.status(200).json({
        success: true,
        message: 'Rating updated successfully',
        rating: existingRating
      });
    }

    // Create new rating
    const newRating = new Rating({
      user: userId,
      product: productId,
      rating,
      review: review || ''
    });

    await newRating.save();

    res.status(201).json({
      success: true,
      message: 'Rating added successfully',
      rating: newRating
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding/updating rating',
      error: error.message
    });
  }
});

/**
 * @route GET /api/ratings/:userId
 * @desc Get all ratings by a user
 * @param {string} userId - The user ID
 */
router.get('/ratings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const ratings = await Rating.find({ user: userId })
      .populate('product')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      userId,
      ratings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ratings',
      error: error.message
    });
  }
});

/**
 * @route GET /api/product-ratings/:productId
 * @desc Get all ratings for a product
 * @param {string} productId - The product ID
 */
router.get('/product-ratings/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const ratings = await Rating.find({ product: productId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    const avgRating = ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      productId,
      totalRatings: ratings.length,
      averageRating: avgRating,
      ratings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product ratings',
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/ratings/:ratingId
 * @desc Delete a rating
 * @param {string} ratingId - The rating ID
 */
router.delete('/ratings/:ratingId', async (req, res) => {
  try {
    const { ratingId } = req.params;

    const deletedRating = await Rating.findByIdAndDelete(ratingId);

    if (!deletedRating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Rating deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting rating',
      error: error.message
    });
  }
});

export default router;
