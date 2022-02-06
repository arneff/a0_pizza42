const express = require("express");
const { join } = require("path");
const authConfig = require("./auth_config.json");
const { requiredScopes } = require('express-oauth2-jwt-bearer');
const { auth } = require("express-oauth2-jwt-bearer");
require('dotenv').config()

const app = express();
const api = express();

const checkJwt = auth({
  audience: authConfig.audience,
  issuerBaseURL: `https://${authConfig.domain}`
});

const checkScopes = requiredScopes('read:users');

// Serve static assets from the /public folder
app.use(express.static(join(__dirname, "public")));
api.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', '*');
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', 'authorization');
  next();
});

// Endpoint to serve the configuration file
app.get("/auth_config.json", (req, res) => {
  res.sendFile(join(__dirname, "auth_config.json"));
});

// Serve the index page for all other requests
app.get("/*", (_, res) => {
  res.sendFile(join(__dirname, "index.html"));
});


// protect this route from unauthorized requests
api.get("/api/external", checkJwt, checkScopes, (req, res) => {
  res.send({msg: "Your access token was successfully validated!"});
});

api.use(function(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    return res.status(401).send({ msg: "Invalid token" });
  }

  next(err, req, res);
});


// Listen on port 3000
app.listen(3000, () => console.log("Application running on port 3000"));
api.listen(3001, () => console.log("Application running on port 3001"));
