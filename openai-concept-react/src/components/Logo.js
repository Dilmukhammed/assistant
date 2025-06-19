import React from 'react';
import { ReactComponent as LogoIcon } from '../assets/logo.svg';

function Logo() {
  return (
    <div className="logo-container">
      <LogoIcon className="logo-icon" />
      <h1 className="logo-text">OpenAI</h1>
    </div>
  );
}

export default Logo;
