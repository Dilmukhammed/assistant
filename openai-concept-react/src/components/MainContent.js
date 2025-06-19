import React from 'react';
import Logo from './Logo';
import FilterPills from './FilterPills';
import SearchBar from './SearchBar'; // Import the SearchBar component

function MainContent() {
  return (
    <main className="main-content">
      <div className="center-container">
        <Logo />
        <FilterPills />
        <SearchBar />
      </div>
    </main>
  );
}

export default MainContent;
