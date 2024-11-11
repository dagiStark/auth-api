import { Request, Response } from "express";
import { CreateSessionInput } from "../schema/auth.schema";
import { findUserByEmail } from "../service/user.service";
import { signAccessToken } from "../service/auth.service";
import { signRefreshToken } from "../service/auth.service";

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
