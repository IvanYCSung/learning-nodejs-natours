const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true }); // merge params allows tourId from tourRoutes .../tours/:tourId/reviews merges to this route

// protect all routes after this middleware
router.use(authController.protect); // all the routes below are protected by authController.protect so we dont need to add authController.protect into all of them

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  ); // only 'user' can post

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  ); // only user' and 'admin' can patch and delete

module.exports = router;
