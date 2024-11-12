import { Request, Response, NextFunction } from "express";

const requireUser = (req: Request, res: Response, next: NextFunction) => {
  const user = res.locals.user;
  if (!user) {
    res.status(403).send("Unauthorized");
  } else {
    next();
  }
};

export default requireUser;
