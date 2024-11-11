import {
  prop,
  getModelForClass,
  modelOptions,
  Severity,
  pre,
  DocumentType,
  index,
} from "@typegoose/typegoose";
import * as argon2d from "argon2";

@modelOptions({
  schemaOptions: { timestamps: true },
  options: { allowMixed: Severity.ALLOW },
})
@pre<User>("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const hash = await argon2d.hash(this.password);
  this.password = hash;
  return;
})

@index({email: 1})

export class User {
  @prop({ lowercase: true, required: true, unique: true })
  email: string;

  @prop({ required: true })
  firstName: string;

  @prop({ required: true })
  lastName: string;

  @prop({ required: true })
  password: string;

  @prop({
    required: true,
    default: async () => (await import("nanoid")).nanoid(),
  })
  verificationCode: string;

  @prop()
  passwordResetCode: string | null;

  @prop({ default: false })
  verified: boolean;

  async validatePassword(this: DocumentType<User>, candidatePassword: string) {
    try {
      return await argon2d.verify(this.password, candidatePassword);
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}

const UserModel = getModelForClass(User);
export default UserModel;
