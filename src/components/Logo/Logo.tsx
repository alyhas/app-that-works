import React from 'react';
import './Logo.scss';

const Logo = () => {
  return (
    <div className="logo-container">
      <img 
        src="/assets/logo.png" 
        alt="Sale Mate Logo" 
        className="logo"
        onError={(e) => {
          // Fallback to text if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = document.createElement('div');
          fallback.className = 'logo-fallback';
          fallback.textContent = 'SM';
          target.parentNode?.insertBefore(fallback, target.nextSibling);
        }}
      />
      <span className="app-name">Sale Mate</span>
    </div>
  );
};

export default Logo;
