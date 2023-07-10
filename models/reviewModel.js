const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review mist belong to a tour'],
    }, // - parent referencing
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review mist belong to a user'],
    }, // - parent referencing
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtual: true },
  }
);

// INDEX - we use compound index to make a tour can only have a review from the a user, the user cannot make another review to the same tour again.
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// POPULATING MIDDLE
reviewSchema.pre(/^find/, function (next) {
  // this.populate({ path: 'tour', select: 'name' }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });

  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

reviewSchema.statics.calAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  console.log(stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// DOCUMENT MIDDLEWARE - runs before or after .save() and .create() in create/save document process. "this" points to the current document.
reviewSchema.post('save', function (next) {
  // in document middlewares, this points to the current document
  // .calAverageRatings() is created above
  this.constructor.calAverageRatings(this.tour); // we use this.constructor.calAverageRatings instead of Review.calAverageRatings as Review is declared after this line
});

// QUERY MIDDLEWARE - runs before or after .find() in query process. "this" points to the current query. Since "this" point to query not document, we can do like above for update and delete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // findByIdUpdate and findByIdDelete are same as findOneAnd...
  this.r = await this.findOne(); // save "r" in query in order to get tour ID
  console.log(this.r);
  next();
});
reviewSchema.post(/^findOneAnd/, async function (next) {
  // .findOne...() does not work here, query has already executed
  await this.r.constructor.calAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
