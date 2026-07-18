import { NextFunction, Request, RequestHandler, Response } from 'express';

/** Wraps an async Express handler so rejected promises reach the error-handling middleware. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
