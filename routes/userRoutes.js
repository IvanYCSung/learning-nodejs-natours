const express = require('express');
const useController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// protect all routes after this middleware
router.use(authController.protect); // all the routes below are protected by authController.protect so we dont need to add authController.protect into all of them
router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', useController.getMe, useController.getUser);
router.patch(
  '/updateMe',
  useController.uploadUserPhoto,
  useController.resizeUserPhoto,
  useController.updateMe
);
router.patch('/deleteMe', useController.deleteMe);

// restrict all routes after this middleware
router.use(authController.restrictTo('admin')); // all the routes below are restricted by authController.restrictTo('admin') so we dont need to add authController.restrictTo('admin') into all of them
router.route('/').get(useController.getAllUsers).post(useController.createUser);
router
  .route('/:id')
  .get(useController.getUser)
  .patch(useController.updateUser)
  .delete(useController.deleteUser);
// since we have delcared the route in the middleware in app.js, we dont have to enter the whole route in the function

module.exports = router;
