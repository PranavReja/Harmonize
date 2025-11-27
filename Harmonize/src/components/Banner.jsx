import React, { useState, useEffect } from 'react';
import './Banner.css';

const Banner = ({ message, onClear }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClear) {
          onClear();
        }
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [message, onClear]);

  return (
    <div className={`banner ${visible ? 'visible' : ''}`}>
      {message}
    </div>
  );
};

export default Banner;