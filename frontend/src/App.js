import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import SessionRoom from './components/SessionRoom';
import { SessionProvider } from './contexts/SessionContext';

function App(){
  const [view, setView] = useState('landing');
  const [sessionData, setSessionData] = useState(null);

  return (
    <SessionProvider>
      {view==='landing' ? (
        <LandingPage onSessionJoined={data=>{
          setSessionData(data);
          setView('session');
        }}/>
      ) : (
        <SessionRoom 
          sessionData={sessionData} 
          onLeaveSession={()=>{
            setView('landing');
            setSessionData(null);
          }}
        />
      )}
    </SessionProvider>
  );
}

export default App;
