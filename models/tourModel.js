const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User = require('./userModel'); used in MODELING TOUR GUIDES MIDDLEWARE - EMBEDDING, we dont need it in CHILD REFERENCING set in schema

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'], // take true/false and error messages
      unique: true,
      trim: true, // trim only works on string schema type, it removes space in the beginning and the end
      mexlength: [40, 'A tour name must have less then or equal 40 characters'],
      minlength: [10, 'A tour name must have less then or equal 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      Required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      Required: [true, 'A tour must have a diffculty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium or diffcult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5, // defaule value is used if no enter
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'], // take true/false and error messages
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
          // this only points to the current doc on NEW document creation
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      }, // custom validator, ({VALUE}) is a Mongoose syntax
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String, // it will be the names of the images which are string
      required: [true, 'A tour must have a cover image'],
    },
    images: [String], // arry of strings
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // Mongoose .select() does not work on this property, used on hide data
    },
    startDates: [Date], // arry of date
    secretTour: {
      type: Boolean,
      default: false,
    },

    // Embedded Geospatial data - GeoJSON
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },

    // Embedded location data - few to few. if we have a list of data, use array
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // guides: Array, - embedding
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }], // - child referencing, Mongoose use object ID as a reference pointed to ref: 'User' which is userModel.js
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// we create a schema like JS class. we can simply only have "type" for each fields, but we can also add more field attributes
// mongoose.Schema(schema, object options)

// Indexes for improving reading performance
// tourSchema.index({ price: -1 }); // creating an index with price order. database reads quickier when users query sort by price
tourSchema.index({ price: -1, ratingsAverage: 1 }); // compound index
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// Virtual properties - not saved in database so we cannot query it
tourSchema.virtual('durationWeek').get(function () {
  return this.duration / 7;
}); // we dont use arrow function here as we are not able to access this in arrow functions. .get() here is not same as .get() used in routes.

// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review', // pointing to Review
  foreignField: 'tour', // tour field in Review
  localField: '_id', // matching _id in Tour
});

//// MONGOOSE MIDDLEWARES - it also has next() like Express JS middleware
// MODELING TOUR GUIDES MIDDLEWARE - EMBEDDING
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// }); we should use child referencing set in schema

// DOCUMENT MIDDLEWARE - runs before or after .save() and .create() in create/save document process. "this" points to the current document.
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});
tourSchema.post('save', function (doc, next) {
  console.log(doc);
  next();
}); // post callback has two parameters, the saved document and next

// QUERY MIDDLEWARE - runs before or after .find() in query process. "this" points to the current query.
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
}); // we dont just use 'find' as a hook, since there are some find queries, such as find, findById, findOne...etc. we use regular expression to select all the hooks start with 'find...'.

// POPULATING MIDDLE
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt', // hide __v and passwordChangedAt fields
  });
  next();
}); // .populate() embeds guides field with the data from userModel instead of ID only

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

// AGGREGATION MIDDLEWARE - runs before or after .aggregate() in aggregation process. "this" points to the current aggregation
tourSchema.pre('aggregate', function (next) {
  if (this.pipeline()[0]['$geoNear']) return next();

  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); // array.unshift() is a Javascript array method
  console.log(this.pipeline());

  next();
});

const Tour = mongoose.model('Tour', tourSchema); // we name models with capital first letter. 'Tour' is the collection name that will be created in the database, it will be converted to lowercase and plural - "tours"

module.exports = Tour;
