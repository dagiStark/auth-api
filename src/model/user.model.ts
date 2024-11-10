import { prop } from "@typegoose/typegoose";

export class User {
  @prop({ lowercase: true, required: true, unique: true })
  email: string;
}
