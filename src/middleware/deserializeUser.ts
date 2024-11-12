import { NextFunction, Request, Response } from "express";
import { verifyJwt } from "../utils/jwt";

const deserializeUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const accessToken = (req.headers.authorization || "").replace(
    /^Bearer\s/,
    ""
  );

  if (!accessToken) {
    return next(); // If no token, proceed without modifying `res.locals.user`
  }

  try {
    const decoded = verifyJwt(accessToken, "accessTokenPublicKey");

    if (decoded) {
      res.locals.user = decoded; // Store the decoded user information
    }

    return next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error("Error verifying JWT:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export default deserializeUser;
