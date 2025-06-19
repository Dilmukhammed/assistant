import React from 'react';
import { ReactComponent as SearchIcon } from '../assets/search-icon.svg';
import { ReactComponent as MicIcon } from '../assets/mic-icon.svg';

function SearchBar() {
  return (
    <div className="search-bar">
      <div className="search-icon">
        <SearchIcon />
      </div>
      <input type="text" placeholder="What is the benefit of using an AI-powered design expert?" />
      <div className="mic-icon">
        <MicIcon />
      </div>
    </div>
  );
}

export default SearchBar;
