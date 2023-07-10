class APIFeatures {
  constructor(query, queryString) {
    // query - Mongoose Query object
    // queryString - url query object
    this.query = query;
    this.queryString = queryString;
  }

  // 1A. Filtering
  filter() {
    const queryObj = { ...this.queryString }; // hard copy the object
    const excludeField = ['page', 'sort', 'limit', 'field']; // we will implement theses functions later, we dont want them to be in query parameters for now.
    excludeField.forEach((el) => delete queryObj[el]);

    // 1B. Advanced Filtering
    let queryStr = JSON.stringify(queryObj); // convert to JSON string
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); // replace gte, gt, lte, lt to $gte, $gt, $lte, $lt per Mongoose query parameters.

    this.query = this.query.find(JSON.parse(queryStr)); // Mongoose method - .find() return a query. we cannot await here as it will execute and then return filtered document straight away. we wont be able to do further to the query anymore.

    // Mongoose syntax - does the same as above but all the methods return "query"
    // const query = Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy')
    return this;
  }

  // 2. Sorting - we use the original query to work on sorting function
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' '); // if there are two sorting query parameters, we use "," to sperate them and join them with space as Moongse method - .sort() takes query parameters in this format
      this.query = this.query.sort(sortBy); // Moongse method - .sort(), not arry.sort()
    } else {
      this.query = this.query.sort('-createdAt'); // fallback sorting
    }
    return this;
  }

  // 3. Field Limiting
  limitFields() {
    if (this.queryString.field) {
      const fields = this.queryString.field.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); // fallback field, - means to exclude
    }
    return this;
  }

  // 4. Pagination
  paginate() {
    const page = this.queryString.page * 1 || 1; // defaule Pagination 1
    const limit = this.queryString.limit * 1 || 100; // defaule 100 results per page
    const skip = (page - 1) * limit;
    // page=2&limit=10 - page 1 : 1-10, page 2 : 11 - 20, skip 10 and limit 10
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
