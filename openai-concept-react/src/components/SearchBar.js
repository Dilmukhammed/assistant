import React, { useState } from 'react';
import { ReactComponent as SearchIcon } from '../assets/search-icon.svg';
import { ReactComponent as MicIcon } from '../assets/mic-icon.svg';

function SearchBar(props) { // Props will now include handleSearchSubmit
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = () => { // No longer async, as fetch is removed
    if (inputValue.trim() === '') {
      return; // Don't submit empty queries
    }

    if (props.handleSearchSubmit && typeof props.handleSearchSubmit === 'function') {
      props.handleSearchSubmit(inputValue); // Pass the query up to MainContent
    } else {
      console.warn('SearchBar: handleSearchSubmit prop is not a function or not provided.');
    }

    setInputValue(''); // Clear the input field after submission
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="search-bar">
      <div className="search-icon">
        <SearchIcon />
      </div>
      <input
        type="text"
        placeholder={props.placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
      />
      <div className="mic-icon">
        <MicIcon />
      </div>
    </div>
  );
}

export default SearchBar;
