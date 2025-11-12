import { createContext, useContext, useState, useEffect } from 'react';

const StateContext = createContext();

export const StateProvider = ({ children }) => {
  const [appState, setAppState] = useState(() => {
    try {
      const storedState = sessionStorage.getItem('appState');
      return storedState ? JSON.parse(storedState) : {};
    } catch (error) {
      console.error('Error reading state from sessionStorage:', error);
      return {};
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('appState', JSON.stringify(appState));
    } catch (error) {
      console.error('Error writing state to sessionStorage:', error);
    }
  }, [appState]);

  const setPageData = (page, data) => {
    setAppState(prevState => ({
      ...prevState,
      [page]: data,
    }));
  };

  const getPageData = (page) => {
    return appState[page] || {};
  };

  const value = {
    setPageData,
    getPageData,
  };

  return (
    <StateContext.Provider value={value}>
      {children}
    </StateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within a StateProvider');
  }
  return context;
};
