const express = require("express");
const { join } = require("path");
const authConfig = require("./auth_config.json");
const { requiredScopes } = require('express-oauth2-jwt-bearer');
const { auth } = require("express-oauth2-jwt-bearer");
require('dotenv').config()
const bodyParser = require('body-parser')
const fetch = require("cross-fetch");


const app = express();
const api = express();

const checkJwt = auth({
  audience: authConfig.audience,
  issuerBaseURL: `https://${authConfig.domain}`
});

const checkScopes = requiredScopes('update:current_user_metadata');

// Serve static assets from the /public folder
app.use(express.static(join(__dirname, "public")));
api.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', '*');
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', 'authorization, content-type');
  next();
});
api.use(bodyParser.json());
api.use(bodyParser.urlencoded({
  extended: true
}));

// Endpoint to serve the configuration file
app.get("/auth_config.json", (req, res) => {
  res.sendFile(join(__dirname, "auth_config.json"));
});

// Serve the index page for all other requests
app.get("/*", (_, res) => {
  res.sendFile(join(__dirname, "index.html"));
});


// protect this route from unauthorized requests
api.post("/api/external", checkJwt, checkScopes, async (req, res) => {
  user_id = req.auth.payload.sub
  res.send({msg: "Your order has been received!", body: req.body});
  
  //request body for mgmt api access token
  const mReq = await fetch('https://dev-h1uc4uvp.us.auth0.com/oauth/token', {
    headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    },
    method: 'POST',
    body: new URLSearchParams( {
      'grant_type': 'client_credentials',
      'client_id': `${process.env.CLIENTID}`,
      'client_secret': `${process.env.CLIENTSECRET}`,
      'audience': 'https://dev-h1uc4uvp.us.auth0.com/api/v2/',
      'scope': 'read:users read:user_idp_tokens update:users update:users_app_metadata'
    })
  
  });
  mResp = await mReq.json();
  mToken = mResp.access_token

  // define object to hold metadata
  uMeta = {
    user_metadata: {
      "orders":[req.body]
    }
  }
  // get user to see if user_metadata is present
  const userReq = await fetch(`https:dev-h1uc4uvp.us.auth0.com/api/v2/users/${user_id}?` +
    new URLSearchParams({
      'fields': 'user_metadata',
      'include_fields': true }), {
    headers: {
      "Authorization": `Bearer ${mToken}`,
      "Content-Type": "application/json",
    }
  });
  
  userResp = await userReq.json() 
  
  if (!userResp.user_metadata.orders){
    const metaReq = await fetch(`https:dev-h1uc4uvp.us.auth0.com/api/v2/users/${user_id}`, {
      headers: {
        "Authorization": `Bearer ${mToken}`,
        "Content-Type": "application/json",
      },
      method: "PATCH",
      body: JSON.stringify(uMeta)
    });
    metaResp = await metaReq.json()

  } else {
    userResp.user_metadata.orders.push(req.body)
    const metaAdd = await fetch(`https:dev-h1uc4uvp.us.auth0.com/api/v2/users/${user_id}`, {
      headers: {
        "Authorization": `Bearer ${mToken}`,
        "Content-Type": "application/json",
      },
      method: "PATCH",
      body: JSON.stringify(userResp)
    });
    addResp = await metaAdd.json()
  }
//   userResp.user_metadata.orders.push(req.body)
 
  


});

api.use(function(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    return res.status(401).send({ msg: "Invalid token" });
  }

  next(err, req, res);
});


// Listen on port 3000
app.listen(process.env.PORT || 3000, () => console.log("Application running on port 3000"));
api.listen(process.env.PORT || 3001, () => console.log("Application running on port 3001"));


