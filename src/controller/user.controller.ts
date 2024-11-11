import { Request, Response } from "express";
import {
  CreateUserInput,
  forgotPasswordInput,
  verifyUserInput,
} from "../schema/user.schema";
import {
  createUser,
  findUserByEmail,
  findUserById,
} from "../service/user.service";
import sendEmail from "../utils/mailer";
import { nanoid } from "nanoid";
import log from "../utils/logger";

export async function createUserHandler(
  req: Request<{}, {}, CreateUserInput>,
  res: Response
): Promise<void> {
  const body = req.body;
  try {
    const user = await createUser(body);

    await sendEmail({
      from: "text@example.com",
      to: user.email,
      subject: "Please verify your account",
      text: `verification code ${user.verificationCode}. Id: ${user._id}`,
    });

    res.send("user created successfully");
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).send("Account already exists");
    }
    res.status(500).send("Internal server error");
  }
}

export async function verifyUserHandler(
  req: Request<verifyUserInput>,
  res: Response
): Promise<void> {
  const id = req.params.id;
  const verificationCode = req.params.verificationCode;

  const user = findUserById(id);

  if (!user) {
    res.send("could not verify user");
  } else if (user.verified) {
    res.send("user already verified");
  } else if (user.verificationCode === verificationCode) {
    user.verified = true;
    await user.save();
    res.send("user successfully verified");
  } else {
    res.send("Could not verify user");
  }
}

export async function forgotPasswordHandler(
  req: Request<{}, {}, forgotPasswordInput>,
  res: Response
): Promise<void> {
  const { email } = req.body;
  const user = await findUserByEmail(email);

  if (!user) {
    res.send("a user with this email doesn't exist");
  } else if (!user.verified) {
    res.send("unverified user");
  } else {
    const passwordResetCode = nanoid();
    user.passwordResetCode = passwordResetCode;

    await user.save();

    await sendEmail({
      to: user.email,
      from: "test@example.com",
      subject: "Reset your password",
      text: `Password reset code: ${passwordResetCode}. Id: ${user._id}`,
    });

    log.debug(`password reset code sent ${user.email}`);

    res.send("Password reset code sent!");
  }
}
