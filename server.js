// Environment variables
const mongoose = require('mongoose');
const dotenv = require('dotenv'); // in order to make node js understands .env files

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION SHUTTING DOWN');
  console.log(err.name, err.message);
  process.exit(1);
}); // handling uncaught exception - it should be on the top of all the code

dotenv.config({ path: './config.env' }); // we set up configurations in the config.env file

const app = require('./app');
// console.log(process.env); the original process.env is set and is added more variables byconfig.env

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection successful'));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION SHUTTING DOWN');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
}); // handling unhandled rejection - catching other errors that we dont handle anywhere
