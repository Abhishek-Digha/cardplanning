import React from 'react';
import { useSession } from '../contexts/SessionContext';
import { sessionAPI } from '../utils/api';

export default function AdminControls(){
  const {session,user,activeStory,isRevealed,dispatch} = useSession();

  // Prevent rendering if required data is missing
  if (!session || !user || !activeStory) return null;

  return (
    <div className="admin-controls">
      <button 
        onClick={async ()=>{
          await sessionAPI.revealVotes(session.id,activeStory.id,user.id);
          // Fetch updated session to get revealed state and votes
          const updatedSession = await sessionAPI.getSession(session.id);
          // Update votes and isRevealed in context
          dispatch({type:'SET',payload:{votes: updatedSession.stories.find(s=>s.id===activeStory.id)?.votes || {}, isRevealed: true}});
        }}
        disabled={isRevealed}
      >
        {isRevealed?'Revealed':'Reveal Votes'}
      </button>
      <button 
        onClick={()=>sessionAPI.clearVotes(session.id,activeStory.id,user.id)}
      >
        Clear Votes
      </button>
    </div>
  );
}
