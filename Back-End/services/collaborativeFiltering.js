import Rating from '../model/rating_model.js';
import User from '../model/user_model.js';
import Product from '../model/product_model.js';

/**
 * Collaborative Filtering Algorithm
 * Uses user-user similarity based on ratings to recommend products
 */

// Calculate similarity between two users (Pearson Correlation)
function calculateSimilarity(user1Ratings, user2Ratings) {
  const commonProducts = Object.keys(user1Ratings).filter(
    (productId) => user2Ratings[productId] !== undefined
  );

  if (commonProducts.length < 2) return 0;

  const mean1 = calculateMean(user1Ratings);
  const mean2 = calculateMean(user2Ratings);

  let numerator = 0;
  let denominator1 = 0;
  let denominator2 = 0;

  commonProducts.forEach((productId) => {
    const diff1 = user1Ratings[productId] - mean1;
    const diff2 = user2Ratings[productId] - mean2;

    numerator += diff1 * diff2;
    denominator1 += diff1 * diff1;
    denominator2 += diff2 * diff2;
  });

  const denominator = Math.sqrt(denominator1 * denominator2);
  if (denominator === 0) return 0;

  return numerator / denominator;
}

// Calculate mean rating
function calculateMean(ratings) {
  const values = Object.values(ratings);
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Get user ratings as a dictionary {productId: rating}
 */
async function getUserRatings(userId) {
  const ratings = await Rating.find({ user: userId });
  const ratingMap = {};
  ratings.forEach((rating) => {
    ratingMap[rating.product.toString()] = rating.rating;
  });
  return ratingMap;
}

/**
 * Find similar users to the target user
 */
async function findSimilarUsers(userId, limit = 5) {
  try {
    const targetUserRatings = await getUserRatings(userId);

    // If user has no ratings, return empty
    if (Object.keys(targetUserRatings).length === 0) {
      return [];
    }

    // Get all users except the target user
    const allUsers = await User.find({ _id: { $ne: userId } });

    const similarities = [];

    for (const user of allUsers) {
      const userRatings = await getUserRatings(user._id);

      // Only consider users with ratings
      if (Object.keys(userRatings).length > 0) {
        const similarity = calculateSimilarity(targetUserRatings, userRatings);
        if (similarity > 0) {
          similarities.push({ userId: user._id, similarity });
        }
      }
    }

    // Sort by similarity and return top users
    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
  } catch (error) {
    console.error('Error finding similar users:', error);
    return [];
  }
}

/**
 * Get collaborative filtering recommendations
 */
export async function getRecommendations(userId, limit = 5) {
  try {
    // Get user's current ratings
    const userRatings = await getUserRatings(userId);
    const userRatedProducts = Object.keys(userRatings);

    // Find similar users
    const similarUsers = await findSimilarUsers(userId, 10);

    if (similarUsers.length === 0) {
      // Fallback: return popular products
      return getPopularProducts(limit, userRatedProducts);
    }

    // Get products rated by similar users
    const productScores = {};

    for (const { userId: similarUserId, similarity } of similarUsers) {
      const similarUserRatings = await getUserRatings(similarUserId);

      for (const [productId, rating] of Object.entries(similarUserRatings)) {
        // Skip products already rated by target user
        if (userRatedProducts.includes(productId)) continue;

        if (!productScores[productId]) {
          productScores[productId] = { weightedSum: 0, similaritySum: 0 };
        }

        productScores[productId].weightedSum += rating * similarity;
        productScores[productId].similaritySum += Math.abs(similarity);
      }
    }

    // Calculate predicted ratings and get top recommendations
    const recommendations = Object.entries(productScores)
      .map(([productId, { weightedSum, similaritySum }]) => ({
        productId,
        predictedRating: similaritySum > 0 ? weightedSum / similaritySum : 0
      }))
      .sort((a, b) => b.predictedRating - a.predictedRating)
      .slice(0, limit);

    // Populate product details
    const populatedRecommendations = await Promise.all(
      recommendations.map(async (rec) => {
        const product = await Product.findById(rec.productId);
        return {
          product,
          predictedRating: rec.predictedRating.toFixed(2)
        };
      })
    );

    return populatedRecommendations;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return [];
  }
}

/**
 * Get popular products as fallback
 */
async function getPopularProducts(limit = 5, excludeProductIds = []) {
  try {
    const ratings = await Rating.aggregate([
      { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      { $match: { count: { $gte: 2 } } }, // At least 2 ratings
      { $sort: { avgRating: -1, count: -1 } },
      { $limit: limit }
    ]);

    const populatedRecommendations = await Promise.all(
      ratings.map(async (rating) => {
        const product = await Product.findById(rating._id);
        return {
          product,
          predictedRating: rating.avgRating.toFixed(2)
        };
      })
    );

    return populatedRecommendations;
  } catch (error) {
    console.error('Error getting popular products:', error);
    return [];
  }
}

/**
 * Get similar products based on user ratings
 */
export async function getSimilarProducts(productId, limit = 5) {
  try {
    // Get users who rated this product
    const ratingUsers = await Rating.find({ product: productId }).select('user');
    const userIds = ratingUsers.map((r) => r.user);

    if (userIds.length === 0) {
      return [];
    }

    // Find products rated by same users
    const similarProductRatings = await Rating.aggregate([
      { $match: { user: { $in: userIds }, product: { $ne: productId } } },
      { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      { $sort: { count: -1, avgRating: -1 } },
      { $limit: limit }
    ]);

    const populatedProducts = await Promise.all(
      similarProductRatings.map(async (item) => {
        const product = await Product.findById(item._id);
        return {
          product,
          commonRaters: item.count,
          avgRating: item.avgRating.toFixed(2)
        };
      })
    );

    return populatedProducts;
  } catch (error) {
    console.error('Error getting similar products:', error);
    return [];
  }
}

export default {
  getRecommendations,
  getSimilarProducts,
  findSimilarUsers
};
