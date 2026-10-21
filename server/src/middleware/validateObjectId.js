/**
 * Reject IDs that are not 24-char hex before hitting MongoDB (TC-API-10).
 * mongoose.isValid() alone accepts some 12-char strings, so we also require hex length 24.
 */
import mongoose from 'mongoose';

export function isMongoObjectId(value) {
  return typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value) && mongoose.Types.ObjectId.isValid(value);
}

export function validateObjectId(paramName = 'id') {
  return (req, _res, next) => {
    const id = req.params[paramName];
    if (!isMongoObjectId(id)) {
      const error = new Error('Invoice ID is not valid.');
      error.statusCode = 400;
      return next(error);
    }
    return next();
  };
}
