import React, { useState } from 'react';
import { useSession } from '../contexts/SessionContext';
import { sessionAPI } from '../utils/api';
import VoteFrequencyDisplay from './VoteFrequencyDisplay';

const POINTS = [1, 2, 3, 5, 8, 13, 21, '?'];

export default function VotingBoard() {
  const {
    session,
    user,
    activeStory,
    votes,
    isRevealed,
    voteCount,
    totalMembers,
    voteFrequency,
    stories
  } = useSession();

  const [sel, setSel] = useState(null);
  const prevStoryId = React.useRef(activeStory?.id);

  // Clear selection when story changes
  React.useEffect(() => {
    if (activeStory?.id !== prevStoryId.current) {
      setSel(null);
      prevStoryId.current = activeStory?.id;
    }
  }, [activeStory?.id]);

  const { dispatch } = useSession();

  const vote = async p => {
    if (!activeStory || isRevealed) return; // ✅ Prevent voting after reveal
    setSel(p);
    const alreadyVoted = votes[user.id] !== undefined;
    const newVotes = { ...votes, [user.id]: p };
    const newVoteCount = alreadyVoted ? voteCount : voteCount + 1;
    dispatch({ type: 'SET', payload: { votes: newVotes, voteCount: newVoteCount } });
    try {
      await sessionAPI.vote(session.id, user.id, activeStory.id, p);
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  const avg = (() => {
    const nums = Object.values(votes).filter(v => typeof v === 'number');
    return nums.length
      ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1)
      : 0;
  })();

  if (!activeStory) {
    return (
      <div className="voting-board">
        <h2>No Active Story</h2>
      </div>
    );
  }

  // Find card number (index+1) for active story in stories array
  let cardNumber = null;
  if (activeStory && stories && stories.length > 0) {
    const idx = stories.findIndex(s => s.id === activeStory.id);
    if (idx !== -1) cardNumber = idx + 1;
  }

  return (
    <div className="voting-board">
      <div
        style={{
          fontWeight: 600,
          fontSize: '1.1rem',
          color: '#1976d2',
          marginBottom: 6
        }}
      >
        Card Name: {activeStory.title}
      </div>
      {activeStory.description && <p>{activeStory.description}</p>}

      {/* ✅ Updated conditional block */}
      {!isRevealed ? (
        <div className="cards">
          {POINTS.map(p => (
            <button
              key={p}
              className={sel === p ? 'selected' : ''}
              onClick={() => vote(p)}
              disabled={votes[user.id] !== undefined} // disable if already voted
              style={{
                opacity: votes[user.id] !== undefined ? 0.5 : 1,
                cursor: votes[user.id] !== undefined ? 'not-allowed' : 'pointer'
              }}
            >
              {p}
            </button>
          ))}
        </div>
      ) : (
        <div className="results">
          <VoteFrequencyDisplay />

          <div
            style={{
              background: 'linear-gradient(90deg, #f8fafc 0%, #e0e7ef 100%)',
              borderRadius: '20px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
              padding: '3.5vw',
              width: '100%',
              maxWidth: '1400px',
              minWidth: 'min(90vw, 600px)',
              border: '1px solid #e0e7ef',
              margin: '0 auto 2.5rem auto',
              transition: 'max-width 0.3s, padding 0.3s'
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: 0,
                background: 'white',
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 1px 8px rgba(0,0,0,0.05)'
              }}
            >
              <thead style={{ background: '#e0e7ef' }}>
                <tr>
                  <th
                    style={{
                      padding: '16px 18px',
                      textAlign: 'left',
                      color: '#2d3a4a',
                      fontWeight: 600,
                      borderBottom: '2px solid #d1d5db',
                      fontSize: '1.05rem'
                    }}
                  >
                    User
                  </th>
                  <th
                    style={{
                      padding: '16px 18px',
                      textAlign: 'center',
                      color: '#2d3a4a',
                      fontWeight: 600,
                      borderBottom: '2px solid #d1d5db',
                      fontSize: '1.05rem'
                    }}
                  >
                    Vote
                  </th>
                </tr>
              </thead>
              <tbody>
                {session.members.map((m, idx) => (
                  <tr
                    key={m.id}
                    style={{ background: idx % 2 === 0 ? '#f8fafc' : 'white' }}
                  >
                    <td
                      style={{
                        padding: '16px 18px',
                        borderBottom: '1px solid #f1f5f9',
                        fontSize: '1.05rem'
                      }}
                    >
                      {m.name}
                    </td>
                    <td
                      style={{
                        padding: '16px 18px',
                        textAlign: 'center',
                        borderBottom: '1px solid #f1f5f9',
                        fontSize: '1.05rem'
                      }}
                    >
                      {votes[m.id] !== undefined ? votes[m.id] : 'No vote'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
