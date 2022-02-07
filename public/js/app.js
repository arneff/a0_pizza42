let auth0 = null;

const fetchAuthConfig = () => fetch("/auth_config.json");

const configureClient = async () => {
    const response = await fetchAuthConfig();
    const config = await response.json();

    auth0 = await createAuth0Client({
        domain: config.domain,
        client_id: config.clientId,
        audience: config.audience
    });
  };

window.onload = async () => {
await configureClient();

updateUI();
const isAuthenticated = await auth0.isAuthenticated();

if (isAuthenticated) {
    // show the gated content
    return;
}

    const query = window.location.search;
    if (query.includes("code=") && query.includes("state=")) {

    // Process the login state
    await auth0.handleRedirectCallback();
    
    updateUI();

    // Use replaceState to redirect the user away and remove the querystring parameters
    window.history.replaceState({}, document.title, "/");
}


};
  
const updateUI = async () => {
const isAuthenticated = await auth0.isAuthenticated();





if (isAuthenticated) {
    const user = await auth0.getUser()
    console.log(user)
    document.getElementById("btn-menu-div").classList.remove("hidden");
    document.getElementById('dropdownMenuButton1').innerHTML = user.name;
    document.getElementById("btn-login-div").classList.add("hidden");
    

} else {
    document.getElementById("btn-login-div").classList.remove("hidden");
}



};
  
const login = async () => {
await auth0.loginWithRedirect({
    redirect_uri: window.location.origin,
    scope: 'update:current_user_metadata',
});
};
  

const logout = () => {
auth0.logout({
    returnTo: window.location.origin
});
};

const profile = async () => {
    const user = await auth0.getUser()
    document.getElementById("pizza-content").classList.add("hidden");
    document.getElementById("profile-content").classList.remove("hidden");
    document.getElementById("user.picture").src=user.picture;
    document.getElementById("user.name").innerHTML = user.name;
    document.getElementById("user.email").innerHTML = user.email;
    document.getElementById("user.idToken").innerHTML = JSON.stringify(user["https://p42.com/orders"])
}

const home = () => {
    document.getElementById("pizza-content").classList.remove("hidden");
    document.getElementById("profile-content").classList.add("hidden");
}

const callApi = async (user, context, callback) => {
    try {
  
      // Get the access token from the Auth0 client
      const token = await auth0.getTokenSilently();
    //   const claims = await auth0.getIdTokenClaims();
    //   console.log(claims)
      const user = await auth0.getUser();
      meta = user.user_metadata
      const date = Date.now();

      const userMeta = await fetch('https://dev-h1uc4uvp.us.auth0.com/userinfo', {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-type": "application/json"
  
          }
      })
      uMResp = await userMeta.json()
      console.log(uMResp)
      //set auth0 user_metadata
      user.user_metadata = user.user_metadata || {};
      user.user_metadata.orders = user.user_metadata.orders || {};
      user.user_metadata.orders = {"date": date, "Pizza": "XL"}
      console.log(user.user_metadata)
      // Make the call to the API, setting the token
      // in the Authorization header
      const response = await fetch("http://localhost:3001/api/external", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-type": "application/json"

        },
        method: 'POST',
        body: JSON.stringify(user.user_metadata.orders)
      });
  
      // Fetch the JSON result
      responseStatus = response.status
      if (responseStatus > 200) {
        document.getElementById("api-call-result").classList.add('alert-danger');
        responseData = "Insufficent Scope: a scope of read:users is required"
      } else {
        document.getElementById("api-call-result").classList.add('alert-success');
        responseData = await response.json();
      }
      
  
    //   Display the result in the output element
      const responseElement = document.getElementById("api-call-result");
      responseElement.innerText = JSON.stringify(responseData, {}, 2);


  
  } catch (e) {
      // Display errors in the console
      console.error(e)
      if (e instanceof Error) {
          if (e.message === 'Login required'){
            document.getElementById("api-call-result").classList.add('alert-danger');
            document.getElementById("api-call-result").innerText = e
          }
      }     
    }
  };
  