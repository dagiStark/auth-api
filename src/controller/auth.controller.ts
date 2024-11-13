import { Request, Response } from "express";
import { get } from "lodash";
import { CreateSessionInput } from "../schema/auth.schema";
import {
  findSessionById,
  signAccessToken,
  signRefreshToken,
} from "../service/auth.service";
import { findUserByEmail, findUserById } from "../service/user.service";
import { verifyJwt } from "../utils/jwt";

export async function createSessionHandler(
  req: Request<{}, {}, CreateSessionInput>,
  res: Response
): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    if (!user.verified) {
      res.status(403).json({ error: "Please verify your email" });
      return;
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const accessToken = signAccessToken(user);

    const refreshToken = await signRefreshToken({ userId: user._id });

    res.status(200).json({
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Error in createSessionHandler:", error);

    res.status(500).json({
      error: "Internal Server Error. Please try again later.",
    });
  }
}
export async function refreshAccessTokenHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const refreshToken = get(req, "headers.x-refresh");

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token is required" });
      return;
    }
    const decoded = verifyJwt<{ session: string }>(
      refreshToken,
      "refreshTokenPublicKey"
    );

    if (!decoded) {
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }
    const session = await findSessionById(decoded.session);
    if (!session || !session.valid) {
      res.status(401).json({ error: "Invalid session" });
      return;
    }
    const user = await findUserById(String(session.user));
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const accessToken = signAccessToken(user);
    res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Error in refreshAccessTokenHandler:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error. Please try again later." });
  }
}
