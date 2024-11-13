import { Request, Response } from "express";
import {
  CreateUserInput,
  forgotPasswordInput,
  resetPasswordInput,
  verifyUserInput,
} from "../schema/user.schema";
import {
  createUser,
  findUserByEmail,
  findUserById,
} from "../service/user.service";
import sendEmail from "../utils/mailer";
import log from "../utils/logger";
import { v4 as uuidv4 } from "uuid"; // Import uuid

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

  try {
    const user = await findUserById(id);

    if (!user) {
      res.status(404).send("User not found");
      return;
    }

    if (user.verified) {
      res.status(400).send("User already verified");
      return;
    }

    if (user.verificationCode === verificationCode) {
      user.verified = true;
      await user.save();
      res.status(200).send("User successfully verified");
    } else {
      res.status(400).send("Invalid verification code");
    }
  } catch (error) {
    console.error("Error verifying user:", error);
    res.status(500).send("Internal server error");
  }
}

export async function forgotPasswordHandler(
  req: Request<{}, {}, forgotPasswordInput>,
  res: Response
): Promise<void> {
  const { email } = req.body;

  try {
    const user = await findUserByEmail(email);

    if (!user) {
      res.status(404).send("A user with this email doesn't exist");
      return;
    }

    if (!user.verified) {
      res.status(403).send("Unverified user");
      return;
    }

    const passwordResetCode = uuidv4();
    user.passwordResetCode = passwordResetCode;

    await user.save();

    await sendEmail({
      to: user.email,
      from: "test@example.com",
      subject: "Reset your password",
      text: `Password reset code: ${passwordResetCode}. Id: ${user._id}`,
    });

    log.debug(`Password reset code sent to ${user.email}`);
    res.status(200).send("Password reset code sent!");
  } catch (error) {
    log.error("Error in forgotPasswordHandler:", error);

    // Return a generic message for the client while logging details internally
    res.status(500).send("An error occurred. Please try again later.");
  }
}

export async function resetPasswordHandler(
  req: Request<resetPasswordInput["params"], {}, resetPasswordInput["body"]>,
  res: Response
): Promise<void> {
  const { id, passwordResetCode } = req.params;
  const { password } = req.body;

  try {
    const user = await findUserById(id);

    // Handle user not found or invalid password reset code
    if (!user) {
      log.warn(`User with ID ${id} not found`);
      res.status(404).send("User not found");
      return;
    }

    if (
      !user.passwordResetCode ||
      user.passwordResetCode !== passwordResetCode
    ) {
      log.warn(`Invalid password reset code for user ${id}`);
      res.status(400).send("Invalid password reset code");
      return;
    }

    // Update password and clear the reset code
    user.passwordResetCode = null;
    user.password = password; // Make sure to hash the password before saving if needed
    await user.save();

    log.info(`Password reset successful for user ${id}`);
    res.status(200).send("Password update successful");
  } catch (error) {
    log.error("Error in resetPasswordHandler:", error);
    res.status(500).send("An error occurred. Please try again later.");
  }
}

export async function getCurrentUserHandler(req: Request, res: Response) {
  res.send(res.locals.user);
}
