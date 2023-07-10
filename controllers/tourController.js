const Tour = require('../models/tourModel');
// const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const multer = require('multer'); // uploading images from HTML forms
const sharp = require('sharp'); // resizing images

const multerStorage = multer.memoryStorage(); // saving images in memory as buffer first for modification

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images', 400), false);
  } // we make sure the uploaded file is an image
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);
// upload.single('image') req.file - upload one image
// upload.field('image array', 5) req.files - upload multi images

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // 1. Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer) // turning buffer into an image
    .resize(2000, 1333) // seting the image's width and height
    .toFormat('jpeg') // seting the image's format
    .jpeg({ quality: 90 }) // seting the image's quality
    .toFile(`public/img/tours/${req.body.imageCover}`); // where to save the image

  // 2. Images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  ); // we use .map here instead of .forEach is because .map saves a new array that makes each iteration await, .forEach just loops through. we use Promise.all to await all the async interations from the call back

  next();
});

////only for testing purposes
// const fs = require('fs');

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// exports.checkId = (req, res, next, val) => {
//   console.log(`Tour id is ${val}`);
//   if (+req.params.id > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID',
//     });
//   }
//   next();
// }; // param middleware

// exports.checkBody = (req, res, next) => {
//   console.log(req.body);
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price',
//     });
//   }
//   next();
// }; // checking middleware, but Mongoose handles it

// Aliasing - alias query parameters instead of using query parameters
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = 'price, -ratingsAverage';
  req.query.field = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// exports.getAllTours = catchAsync(async (req, res, next) => {
// console.log(req.requestTime); from the middleware

//// BUILD QUERY
// 1A. Filtering
// 1B. Advanced Filtering
// 2. Sorting
// 3. Field Limiting
// 4. Pagination

//// EXECUTE QUERY
// const features = new APIFeatures(Tour.find(), req.query)
//   .filter()
//   .sort()
//   .limitFields()
//   .paginate();

// const tours = await features.query;
// we await here to get filtered document as we dont need to work on the query anymore

//// SEND RESPONSE
//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: {
//       tours, // tours: tours
//     },
//   });
// }); re-factory with a callback from handlerFactory, see below
exports.getAllTours = factory.getAll(Tour);

// exports.getTour = catchAsync(async (req, res, next) => {
// console.log(req.params.id); the id from the params is string
// const id = +req.params.id; turning the id into number
// const tour = tours.find((el) => el.id === id);
// we use Mongoose .findById(), see below

// const tour = await Tour.findById(req.params.id).populate('reviews');
// .findById() is a simple version of Tour.findOne({_id: req.params.id})

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// }); re-factory with a callback from handlerFactory, see below
exports.getTour = factory.getOne(Tour, { path: 'reviews' });

// exports.createTour = catchAsync(async (req, res, next) => {
// const newTour = new Tour({})
// newTour.save()

// we create an instance from the model and use save() built in prototype method, return a promise

// const newTour = await Tour.create(req.body);
// no instance created, we just use the model directly, return a promise

//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour,
//     },
//   });
// }); re-factory with a callback from handlerFactory, see below
exports.createTour = factory.createOne(Tour);

// exports.updateTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true, // update method does not go through schema validation as it only happens in create method, so we turn on the validator to run the check again
//   }); // .findByIdAndUpdate(the tour id, the update data, options)

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// }); re-factory with a callback from handlerFactory, see below
exports.updateTour = factory.updateOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(204).json({
//     // status 204 - no contains, data deleted successfully
//     status: 'success',
//     data: null,
//   });
// }); re-factory with a callback from handlerFactory, see below
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' }, // group takes _id to group data by difficulty
        numTours: { $sum: 1 }, // add 1 for each tour, like a counter
        numRatings: { $sum: '$ratingsQuantity' }, // select fields by using '$xxxxx'
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // }, we can repeat stages that we have used, like $match here
  ]); // MondoDB method - .aggregate() contains stages array, each stage get wrapped in an object

  res.status(200).json({
    status: 'success',
    data: { stats },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates', // stage - unwind deconstructs arry and duplicates the rest of data
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStates: { $sum: 1 },
        tour: { $push: '$name' }, //$push makes an array
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0, // 0 hides field, 1 shoes field
      },
    },
    {
      $sort: {
        numTourStates: -1, // -1 is descending, 1 is ascending
      },
    },
    {
      $limit: 12, // limit number of the data
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: { plan },
  });
});

exports.getTourWithin = catchAsync(async (req, res, next) => {
  // /tours-within/:distance/center/:latlng/unit/:unit
  // /tour-within/233/center/34.111745,-118.113491/unit/mi
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; // if mile, distance in miles / 3963.2 otherwise distance in kelometer / 6378.1

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: { $centerSphere: [[lng, lat], radius] },
    },
  });

  res.status(200).json({
    status: 'success',
    result: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001; // meter to mile otherwise to kelometer

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng'
      ),
      400
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    statusbar: 'success',
    results: distances.length,
    data: {
      data: distances,
    },
  });
});
