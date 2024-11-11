const dotenv = require("dotenv");
import express from "express";
import config from "config";
import connectToDb from "./utils/connectToDb";
import router from "./routes";

dotenv.config();
const app = express();

app.use(express.json());
app.use(router);

const port = config.get("port");
app.listen(port, () => {
  connectToDb();
  console.log(`app started listening on port ${port}`);
});
