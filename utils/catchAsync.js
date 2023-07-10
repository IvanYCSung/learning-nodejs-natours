module.exports = (fn) => {
  // return (req, res, next) => {
  // fn(req, res, next).catch((err) => next(err));
  // };
  // since catch takes a callback passing one parameter and next() is a callback function taking one parameter, we can simplize like below

  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// we return a function because we are awaiting user to hit this route and trigger this function, so we cannot do below as it will call the function straight away. also, it doesn't know what req, res and next are.

// module.exports = fn => {fn(req, res, next).catch(next)}
