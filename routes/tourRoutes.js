const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');
// const reviewController = require('../controllers/reviewController');

const router = express.Router({ mergeParas: true });

// Nested routes
// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );
// POST /tour/tourID/reviews
// GET /tour/tourID/reviews
// GET /tour/tourID/reviews/userID
// but we build it with tour router like below, we need to merge tourId to reviewRoutes
router.use('/:tourId/reviews', reviewRouter);

////only for testing purposes
// router.param('id', tourController.checkId);

// Aliasing - alias query parameters instead of using query parameters
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours); // chaining middlewares

// Aggregation Pipeline Stage
router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getTourWithin);
// /tours-within?distance=233&center=-40,45&unit=mi - we will make our URL like below
// /tours-within/233/center/34.111745,-118.113491/unit/mi

router.route('/distance/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );
// .post(tourController.checkBody, tourController.createTour); chaining multi middleware functions

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );
// since we have delcared the route in the middleware in the app.js, we dont have to enter the whole route in the function

module.exports = router;
