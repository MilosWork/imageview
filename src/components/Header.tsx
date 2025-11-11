import React from 'react';
import './Header.css';

interface HeaderProps {
  onAdd?: () => void;
}

function Header({ onAdd }: HeaderProps) {
  return (
    <header className="App-header">
      <button className="header-button" onClick={onAdd}>
        Add New Image
      </button>
    </header>
  );
}

export default Header;
