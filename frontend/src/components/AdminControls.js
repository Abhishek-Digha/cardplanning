import React from 'react';
import { useSession } from '../contexts/SessionContext';
import { sessionAPI } from '../utils/api';
export default function AdminControls(){
  const [customNumber, setCustomNumber] = React.useState("");
  const [updating, setUpdating] = React.useState(false);
  const {session,user,activeStory,isRevealed,dispatch,votes,voteCount,totalMembers} = useSession();
  // Calculate vote count and total members for the current active story

  // Prevent rendering if required data is missing
  if (!session || !user || !activeStory) return null;

  // Calculate vote status for each member
  const memberCount = session?.members?.length || 0;
  const submittedCount = session?.members?.filter(m => votes && votes[m.id] !== undefined).length || 0;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      padding: '2vw 0',
      minHeight: 0,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        padding: '2.5rem 2vw 2rem 2vw',
        width: '100%',
        maxWidth: 520,
        border: '1px solid #e0e7ef',
        marginBottom: 32,
        marginTop: 8,
        transition: 'box-shadow 0.2s',
      }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22}}>
          <span style={{fontWeight: 700, fontSize: '1.25rem', color: '#2d3a4a', letterSpacing: 0.5}}>Voting Status</span>
          <span style={{fontWeight:600, fontSize:'1.08rem', color:'#1976d2', textAlign:'right', background:'#e3f0fc', borderRadius:8, padding:'4px 14px', minWidth:120, display:'inline-block'}}>Votes: {submittedCount}/{memberCount}</span>
        </div>
        <table style={{width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.04)'}}>
          <thead style={{background: '#f3f6fa'}}>
            <tr>
              <th style={{padding: '13px 16px', textAlign: 'left', color: '#2d3a4a', fontWeight: 700, borderBottom: '2px solid #e0e7ef', fontSize: '1.08rem'}}>Member</th>
              <th style={{padding: '13px 16px', textAlign: 'center', color: '#2d3a4a', fontWeight: 700, borderBottom: '2px solid #e0e7ef', fontSize: '1.08rem'}}>Voted</th>
            </tr>
          </thead>
          <tbody>
            {session.members && session.members.map((member, idx) => (
              <tr key={member.id} style={{background: idx % 2 === 0 ? '#f8fafc' : '#fff'}}>
                <td style={{padding: '13px 16px', borderBottom: '1px solid #f3f6fa', fontSize: '1.07rem', fontWeight: 500}}>{member.name || member.username || member.id}</td>
                <td style={{padding: '13px 16px', textAlign: 'center', borderBottom: '1px solid #f3f6fa', fontSize: '1.07rem'}}>
                  {votes && votes[member.id] !== undefined ? <span style={{color: '#22c55e', fontWeight: 700, fontSize: '1.25rem'}}>✔</span> : <span style={{color: '#ef4444', fontWeight: 700, fontSize: '1.25rem'}}>✗</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={async ()=>{
          await sessionAPI.revealVotes(session.id,activeStory.id,user.id);
          // Fetch updated session to get revealed state and votes
          const updatedSession = await sessionAPI.getSession(session.id);
          // Update votes and isRevealed in context
          dispatch({type:'SET',payload:{votes: updatedSession.stories.find(s=>s.id===activeStory.id)?.votes || {}, isRevealed: true}});
        }}
        disabled={isRevealed}
        style={{
          padding:'12px 32px',
          background: isRevealed ? '#a3a3a3' : 'linear-gradient(90deg, #1976d2 0%, #43a047 100%)',
          color:'#fff',
          border:'none',
          borderRadius:8,
          cursor: isRevealed ? 'not-allowed' : 'pointer',
          fontWeight:'bold',
          fontSize:19,
          marginTop:'0.5rem',
          marginBottom:'0.5rem',
          boxShadow:'0 2px 8px rgba(25,118,210,0.10)'
        }}
      >
        {isRevealed ? 'Revealed' : 'Reveal'}
      </button>
    </div>
  );
}
