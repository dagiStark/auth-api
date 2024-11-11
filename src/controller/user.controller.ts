import { Request, Response } from "express";
import { CreateUserInput } from "../schema/user.schema";
import { createUser } from "../service/user.service";
import sendEmail from "../utils/mailer";

export async function createUserHandler(
  req: Request<{}, {}, CreateUserInput>,
  res: Response
) {
  const body = req.body;
  try {
    const user = await createUser(body);

    await sendEmail()
    return res.send("user created successfully");
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).send("Account already exists");
    }
    return res.status(500).send("Internal server error");
  }
}
