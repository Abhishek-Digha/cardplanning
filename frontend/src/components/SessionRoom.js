import React, { useEffect, useState } from 'react';
import { useSession } from '../contexts/SessionContext';
import { sessionAPI } from '../utils/api';
import MembersList from './MembersList';
import StoryManager from './StoryManager';
import VotingBoard from './VotingBoard';
import AdminControls from './AdminControls';

export default function SessionRoom({sessionData,onLeaveSession}){
  const {dispatch,socket,session,user} = useSession();
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    dispatch({ type: 'SET', payload: {
  session: {
    id: sessionData.sessionId,
    code: sessionData.sessionCode,
    members: [],         // will be populated by fetch
    stories: [],         // will be populated by fetch
    activeStoryId: null,
    userId: sessionData.userId
  },
  user: sessionData.user
}});

    socket.emit('joinSession',sessionData.sessionId);
    sessionAPI.getSession(sessionData.sessionId)
      .then(full=>{
        dispatch({type:'SET',payload:{session:full,stories:full.stories}});
        if(full.activeStoryId){
          const as=full.stories.find(s=>s.id===full.activeStoryId);
          dispatch({type:'SET_ACTIVE',payload:as});
        }
      })
      .finally(()=>setLoading(false));
  },[]);

  if(loading) return <div className="loading">Loading...</div>;

  return (
    <div className="session-room">
      <header style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <h1>Session Code: <strong>{session.code}</strong></h1>
        <div style={{display:'flex',alignItems:'center',gap:'1em'}}>
          <button style={{background:'#1976d2',color:'#fff',borderRadius:'20px',padding:'6px 16px',border:'none',fontWeight:'bold',cursor:'default'}}>
            {user?.name}
          </button>
          <button onClick={onLeaveSession}>Leave</button>
        </div>
      </header>
      <div className="content">
        <aside>
          <MembersList />
          <StoryManager />
        </aside>
        <main>
          <VotingBoard />
          {user.isAdmin && <AdminControls />}
        </main>
      </div>
    </div>
  );
}
