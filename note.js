//// Rest architecture
// 1. Separate API into logical resources
// 2. Expose structured, resource-based URL, such us /tours (usually plural) instead of /gettour or /deletetour as we use get, delete...action in point 4
// 3. Use HTTP methods, such as GET, POST, PUT, DELETE, PATCH...
// 4. Send data as JSON (usually)
// 5. Be Stateless, server should not remember any previous data or previous state sent to clients

//// Environments variables
// 1. We have different setting of NODE_ENV in config.env (NODE_ENV=development) and package.json (SET NODE_ENV=production) in production environment, but package.json file has the priority to overwrite NODE_ENV value.
// 2. Environments configration must start before any code, see in server.js
// 3. We use NODE_ENV value to see different data in development or production environment, see app.js

// Error handing
// 1. We set a global error handler middleware with four parameters, err, req, res and next, as Express knows the middleware having four parameters is an error handler.
// 2. When we pass anything into next() in the middlewares, Express knows to trigger the global error handler middleware we created per step 1.
// 3. We pass an instance of AppError into next() per step 2 to trigger the global error handler middleware - errorController.
// 4. The global error handler middleware - errorController receives the AppError instance as the 1st parameter.
// 5. In errorController, we send an error response to the user.

// In model, "this" in middlewares points to the query
// In model, "this" in instance methods points to the document

// Altas MongoDB password : rs5ejmgw76IPWh9r
//JWT_SECRET in config.env used for JWT should be at least 32 characters long
