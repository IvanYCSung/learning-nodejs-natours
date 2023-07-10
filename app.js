const express = require('express');
const path = require('path');
const morgan = require('morgan'); // 3rd party middleware
const rateLimit = require('express-rate-limit'); // security - rate limit
const helmet = require('helmet'); // security - HTTP headers
const mongoSanitize = require('express-mongo-sanitize'); // security - data sanitization
const xss = require('xss-clean'); // security - data sanitization
const hpp = require('hpp'); // security - HTTP parameter pollution
const cookieParser = require('cookie-parser'); // in order to access browser cookie from the server

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

// Start express
const app = express();

app.set('view engine', 'pug'); // setting view enging to pug
app.set('views', path.join(__dirname, 'views')); // setting views path

//////////// golbal middleware stack - define before routes handlers

//// how use a middleware to access static file
app.use(express.static(path.join(__dirname, 'public')));
// we can access html file or img file
// http://127.0.0.1:3000/overview.html
// http://127.0.0.1:3000/img/pin.png

//// security - HTTP headers middleware in the beginning of the global middleware stack
// app.use(helmet()); // helmet contains multiple middlewares to set up browser security settings - causing bug, comment it out

if (process.env.NODE_ENV === 'development') app.use(morgan('dev')); // writing info into console about the request

//// security - rate limiting middleware in the beginning of the global middleware stack
const limiter = rateLimit({
  max: 100, // 100 times request from the same IP
  windowMs: 60 * 60 * 1000, // 1 hour in milliseconds
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// body parser, reading data from body into req.body as Express does not come with it by default
app.use(express.json({ limit: '10kb' })); // set limit 10kb for sercurity reason, we limit the coming data under 10kb
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // parse the data coming from html form
app.use(cookieParser()); // parse the data from cookie

//// security - data sanitization middleware after body is parsed
// against NoSQL query injection
app.use(mongoSanitize()); // remove malicious queries in input
//// against XSS
app.use(xss()); // remove malicious code from outside resource injected in our applications

//// security - HTTP parameter pollution middileware
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
); // whitelist allows duplicated query strings

//// test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); // can be used in the routes handlers
  next();
});
// we can build our own multiple middleware in the stak and must use next() to pass down to the next middleware
// we can add data to req and res, they can be used in the routes handlers

//////////// reading a JSON data file and parse it into object
// moved to "tourRoute" module
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
// );

//////////// Route handlers
// moved to "tourControllers" and "useControllers" module

////////////Routes
//// Get all the tours
// app.get('/api/v1/tours', getAllTours);
//// Get a single tour
// app.get('/api/v1/tours/:id', getTour);
//// Create a tour
// app.post('/api/v1/tours', createTour);
//// Patch a tour
// app.patch('/api/v1/tours/:id', updateTour);
//// Delete a tour
// app.delete('/api/v1/tours/:id', deleteTour);
//// or we can chain them up since they share the same URL

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
// moved to "tourRoute" module, leaving above middleware here to mount the router
// For the built in middleware, we dont need to use next()

app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl} on this server!`); create a new error object
  // err.status = 'fail'; add a property in the errror object
  // err.statusCode = 404; add a property in the errror object

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404)); // when we pass an error into next(), the error message will be passed down to the error handler middleware. it doesnt matter how many middlewares are between this middleware and the error handler middleware.
}); // .app() is for all the methods, such as GET, POST, PATCH, DELETE...etc., '*' means all the routes

// Global error handler middleware
app.use(globalErrorHandler);

//////////// Start a server
// moved to "server"
module.exports = app;
