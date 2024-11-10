require("dotenv");
import express from "express";
import config from "config";
import connectToDb from "./utils/connectToDb";

const app = express();

const port = config.get("port");

app.listen(port, () => {
  connectToDb();
  console.log(`app started listening on port ${port}`);
});
