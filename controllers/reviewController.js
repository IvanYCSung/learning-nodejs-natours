const Review = require('../models/reviewModel');
// const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// exports.getAllReviews = catchAsync(async (req, res, next) => {
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };

//   const reviews = await Review.find(filter);

//   res
//     .status(200)
//     .json({ status: 'success', results: reviews.length, data: { reviews } });
// }); re-factory with a callback from handlerFactory, see below
exports.getAllReviews = factory.getAll(Review);

exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId; // use tour ID from params as request body tour in creatReview
  if (!req.body.user) req.body.user = req.user.id; // use user ID from authController.protect as request body user in creatReview
  next();
};

// exports.createReview = catchAsync(async (req, res, next) => {
//   const newReview = await Review.create(req.body);
//   res.status(201).json({
//     status: 'success',
//     data: {
//       review: newReview,
//     },
//   });
// }); re-factory with a callback from handlerFactory, see below
exports.createReview = factory.createOne(Review);

exports.getReview = factory.getOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
