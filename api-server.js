const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const jwt = require("express-jwt");
const jwtScope = require('express-jwt-scope');
const jwksRsa = require("jwks-rsa");
const authConfig = require("./src/auth_config.json");
const fetch = require("cross-fetch");
require('dotenv').config()

const app = express();

const port = process.env.API_PORT || 3001;
const appPort = process.env.SERVER_PORT || 3000;
const appOrigin = authConfig.appOrigin || `http://localhost:${appPort}`;

if (!authConfig.domain || !authConfig.audience) {
  throw new Error(
    "Please make sure that auth_config.json is in place and populated"
  );
}

app.use(morgan("dev"));
app.use(helmet());
app.use(cors({ origin: appOrigin }));


app.use(express.json());
app.use(express.urlencoded({ extended: true }))

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`
  }),

  audience: authConfig.audience,
  issuer: `https://${authConfig.domain}/`,
  algorithms: ["RS256"]
});

const checkScopes = jwtScope('update:current_user_metadata');


app.post("/api/external", checkJwt, checkScopes,  async (req, res) => {
  const user_id = req.user.sub
  // console.log("req: " + JSON.stringify(req.user))
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
  const mResp = await mReq.json();
  const mToken = mResp.access_token
  // define object to hold metadata
  const uMeta = {
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
  
  const userResp = await userReq.json()
  console.log("resp: "+ JSON.stringify(userResp)) 
  console.log(userResp.user_metadata.orders)
  if (userResp.user_metadata.orders){
    userResp.user_metadata.orders.push(req.body)
    const metaAdd = await fetch(`https:dev-h1uc4uvp.us.auth0.com/api/v2/users/${user_id}`, {
      headers: {
        "Authorization": `Bearer ${mToken}`,
        "Content-Type": "application/json",
      },
      method: "PATCH",
      body: JSON.stringify(userResp)
      
    });
    const addResp = await metaAdd.json()

  } else {
    const metaReq = await fetch(`https:dev-h1uc4uvp.us.auth0.com/api/v2/users/${user_id}`, {
      headers: {
        "Authorization": `Bearer ${mToken}`,
        "Content-Type": "application/json",
      },
      method: "PATCH",
      body: JSON.stringify(uMeta)
    });
    const metaResp = await metaReq.json()
  }
});

app.listen(port, () => console.log(`API Server listening on port ${port}`));
