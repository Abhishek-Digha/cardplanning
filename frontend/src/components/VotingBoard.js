import React, { useState } from 'react';
import { useSession } from '../contexts/SessionContext';
import { sessionAPI } from '../utils/api';

const POINTS=[1,2,3,5,8,13,21,'?'];

export default function VotingBoard(){
  const {session,user,activeStory,votes,isRevealed,voteCount,totalMembers} = useSession();
  const [sel,setSel]=useState(null);
  const prevStoryId = React.useRef(activeStory?.id);

  // Clear selection when story changes
  React.useEffect(() => {
    if (activeStory?.id !== prevStoryId.current) {
      setSel(null);
      prevStoryId.current = activeStory?.id;
    }
  }, [activeStory?.id]);

  const vote = async p=>{
    if(!activeStory || isRevealed) return;
    setSel(p);
    await sessionAPI.vote(session.id,user.id,activeStory.id,p);
  };

  const avg=(()=>{
    const nums=Object.values(votes).filter(v=>typeof v==='number');
    return nums.length
      ?(nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(1)
      :0;
  })();

  if(!activeStory) return (
    <div className="voting-board">
      <h2>No Active Story</h2>
    </div>
  );

  return (
    <div className="voting-board">
      <h2>{activeStory.title}</h2>
      {activeStory.description && <p>{activeStory.description}</p>}
      <div>Votes: {voteCount}/{totalMembers}</div>

      {!isRevealed ? (
        <div className="cards">
          {POINTS.map(p=>(
            <button
              key={p}
              className={sel===p?'selected':''}
              onClick={()=>vote(p)}
            >{p}</button>
          ))}
        </div>
      ) : (
        <div className="results">
          <div>Average: {avg}</div>
          <table style={{marginTop:'1em',width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr>
                <th style={{border:'1px solid #ccc',padding:'4px'}}>User</th>
                <th style={{border:'1px solid #ccc',padding:'4px'}}>Vote</th>
              </tr>
            </thead>
            <tbody>
              {session.members.map(m=>(
                <tr key={m.id}>
                  <td style={{border:'1px solid #ccc',padding:'4px'}}>{m.name}</td>
                  <td style={{border:'1px solid #ccc',padding:'4px'}}>{votes[m.id]!==undefined?votes[m.id]:'No vote'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
