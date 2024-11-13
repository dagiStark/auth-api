import dotenv from "dotenv";
import express from "express";
import config from "config";
import connectToDb from "./utils/connectToDb";
import router from "./routes";
import deserializeUser from "./middleware/deserializeUser";

dotenv.config();
const app = express();

app.use(express.json());
app.use(deserializeUser);
app.use(router);

const port = config.get("port");
app.listen(port, () => {
  connectToDb();
  console.log(`app started listening on port ${port}`);
});
