const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const multer = require('multer'); // uploading images from HTML forms
const sharp = require('sharp'); // resizing images

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users'); // sets where to save photos
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`); // file name sets to user-userId-time.jpeg
//   },
// });
// saving in the disk storage, but we are resizing photos so not we want to save them in memory first

const multerStorage = multer.memoryStorage(); // saving images in memory as buffer first for modification

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images', 400), false);
  } // we make sure the uploaded file is an image
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single('photo'); // upload.single('photo') sets one img uploaded from HTML the form that has name='photp'
// upload.single('image') req.file - upload one image
// upload.field('image', 5) req.files - upload multi images

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer) // turning buffer into an image
    .resize(500, 500) // seting the image's width and height
    .toFormat('jpeg') // seting the image's format
    .jpeg({ quality: 90 }) // seting the image's quality
    .toFile(`public/img/users/${req.file.filename}`); // where to save the image

  next();
});

const filterObj = (obj, ...allowedField) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedField.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1. Create an error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates, please use /updateMyPassword',
        400
      )
    );
  }

  // 2.
  const filteredBody = filterObj(req.body, 'name', 'email'); // we only allow user to change name and email fields
  if (req.file) filteredBody.photo = req.file.filename;

  // 3. Update user document
  const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updateUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   const users = await User.find();

//   res.status(200).json({
//     status: 'success',
//     results: users.length,
//     data: {
//       users,
//     },
//   });
// }); re-factory with a callback from handlerFactory, see below
exports.getAllUsers = factory.getAll(User);

// exports.getUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined',
//   });
// }; re-factory with a callback from handlerFactory, see below
exports.getUser = factory.getOne(User);

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead',
  });
};

// exports.updateUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined',
//   });
// }; re-factory with a callback from handlerFactory, see below
exports.updateUser = factory.updateOne(User); // do not update passwords with this

// exports.deleteUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined',
//   });
// }; re-factory with a callback from handlerFactory, see below
exports.deleteUser = factory.deleteOne(User);
