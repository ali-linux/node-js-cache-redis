const express = require("express");
const axios = require("axios");
const redis = require("redis");
const responseTime = require("response-time");
const { promisify } = require("util");

const app = express();
app.use(responseTime());

const client = redis.createClient({
  host: "127.0.0.1",
  port: 6379,
});

const GET_ASYNC = promisify(client.get).bind(client);
const SET_ASYNC = promisify(client.set).bind(client);

app.get("/rockets", async (req, res, next) => {
  try {
    const reply = await GET_ASYNC("rockets");
    if (reply) {
      console.log("using cache data");
      res.send(JSON.parse(reply));
      return;
    }
    const response = await axios.get("https://api.spacexdata.com/v3/rockets");
    const saveResult = await SET_ASYNC(
      "rockets",
      JSON.stringify(response.data),
      "EX",
      50000
    );
    console.log(saveResult);
    console.log(saveResult.data);
    res.send(response.data);
  } catch (err) {
    res.send(err.message);
  }
});

app.get("/rockets/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    let rockets = await GET_ASYNC("rockets");
    if (rockets) {
      console.log("using cache data");
      rockets = JSON.parse(rockets);
      const rocket = rockets.find((r, index) => {
        if (r.rocket_id == id) return true;
      });
      res.send(rocket);
      return;
    }
    const response = await axios.get(
      `https://api.spacexdata.com/v3/rockets/${id}`
    );
    res.send(response.data);
  } catch (err) {
    res.send(err.message);
  }
});

app.listen(3000, () => {
  console.log("on port 3000");
});
