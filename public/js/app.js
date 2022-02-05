let auth0 = null;

const fetchAuthConfig = () => fetch("/auth_config.json");

const configureClient = async () => {
    const response = await fetchAuthConfig();
    const config = await response.json();
  
    auth0 = await createAuth0Client({
      domain: config.domain,
      client_id: config.clientId
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
  
  
  }
  
  const updateUI = async () => {
    const isAuthenticated = await auth0.isAuthenticated();
    
    
  
    
  
    if (isAuthenticated) {
      const user = await auth0.getUser()
      document.getElementById("btn-menu-div").classList.remove("hidden");
      document.getElementById("btn-login-div").classList.add("hidden");
      document.getElementById("gated-content").classList.remove("hidden");
  
      
  
    } else {
      document.getElementById("btn-login-div").classList.remove("hidden");
      document.getElementById("gated-content").classList.add("hidden");
    }
  
  
  
  };
  
  const login = async () => {
    await auth0.loginWithRedirect({
      redirect_uri: window.location.origin,
      scope: 'read:users',
    });
  };
  
  
  const logout = () => {
    auth0.logout({
      returnTo: window.location.origin
    });
  };