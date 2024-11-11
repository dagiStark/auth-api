import { Request, Response } from "express";
import { CreateUserInput, verifyUserInput } from "../schema/user.schema";
import { createUser, findUserById } from "../service/user.service";
import sendEmail from "../utils/mailer";

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
