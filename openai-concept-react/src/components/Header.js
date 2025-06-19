import React from 'react';
import { ReactComponent as ProfileIcon } from '../assets/profile-icon.svg';
import { ReactComponent as MenuIcon } from '../assets/menu-icon.svg';
// Note: style.css is imported in App.js, so styles should apply.

function Header() {
  return (
    <header className="top-nav">
      <div className="nav-icon">
        <ProfileIcon />
      </div>
      <div className="nav-icons-right">
        <div className="nav-icon">
          <MenuIcon />
        </div>
      </div>
    </header>
  );
}

export default Header;
