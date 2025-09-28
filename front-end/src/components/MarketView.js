// components/MarketView.js
import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Body from './Body';
import Futures from './Futures';

export default function MarketView({ auth_token }) {
  const [currentView, setCurrentView] = useState('stocks'); // 'stocks' or 'futures'

  return (
    <AnimatePresence mode="wait">
      {currentView === 'stocks' ? (
        <Body 
          key="stocks"
          auth_token={auth_token} 
          onViewChange={setCurrentView}
          currentView={currentView}
        />
      ) : (
        <Futures 
          key="futures"
          auth_token={auth_token} 
          onViewChange={setCurrentView}
          currentView={currentView}
        />
      )}
    </AnimatePresence>
  );
}