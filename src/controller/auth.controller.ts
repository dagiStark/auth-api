import { Request, Response } from "express";
import { CreateSessionInput } from "../schema/auth.schema";
import { findUserByEmail, findUserById } from "../service/user.service";
import { findSessionById, signAccessToken } from "../service/auth.service";
import { signRefreshToken } from "../service/auth.service";
import { get } from "lodash";
import { verifyJwt } from "../utils/jwt";

export async function createSessionHandler(
  req: Request<{}, {}, CreateSessionInput>,
  res: Response
): Promise<void> {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);

  if (!user) {
    res.status(400).send("User not found");
  } else if (!user.verified) {
    res.status(400).send("Verify your email");
  } else if (!user.validatePassword(password)) {
    res.status(400).send("Invalid password");
  } else {
    const accessToken = signAccessToken(user);
    const refreshToken = await signRefreshToken({ userId: user._id });

    res.send({
      accessToken,
      refreshToken,
    });
  }
}

export async function refreshAccessTokenHandler(
  req: Request,
  res: Response
): Promise<void> {
  const refreshToken = get(req, "headers.x-refresh");

  const decoded = verifyJwt<{ session: string }>(
    refreshToken,
    "refreshTokenPublicKey"
  );

  if (!decoded) {
    return res.status(401).send("could not refresh access token");
  }

  const session = await findSessionById(decoded.session);
  if (!session || !session.valid) {
    return res.status(401).send("could not refresh access token");
  }

  const user = await findUserById(String(session.user));

  if (!user) {
    return res.status(401).send("user doesn't exist");
  }

  const accessToken = signAccessToken(user);
  res.status(200).send(accessToken);
}
