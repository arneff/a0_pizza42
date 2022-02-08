import React from "react";

import pizza from "../assets/pizza.png";

const Hero = () => (
  <div className="text-center hero my-5">
    <img className="mb-3 app-logo" src={pizza} alt="React logo" width="120" />
    <h1 className="mb-4">Pizza 42</h1>

    <p className="lead">
      This is a sample application that demonstrates an authentication flow for
      an SPA, using <a href="https://reactjs.org">React.js</a>
    </p>
  </div>
);

export default Hero;
