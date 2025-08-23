import React from 'react';
import { useSession } from '../contexts/SessionContext';

const VoteFrequencyDisplay = () => {
  const { voteFrequency, isRevealed, votes, totalMembers } = useSession();
  console.log('Vote Frequency:', voteFrequency);
  console.log('Votes:', votes);
  console.log('Is Revealed:', isRevealed);

  if (!isRevealed) return null;

  // Calculate frequency from votes if voteFrequency is empty
  const frequencies = voteFrequency && Object.keys(voteFrequency).length > 0
    ? Object.entries(voteFrequency)
    : Object.entries(
        Object.values(votes).reduce((acc, vote) => {
          acc[vote] = (acc[vote] || 0) + 1;
          return acc;
        }, {})
      );

  // Find majority vote and calculate statistics
  let majorityVote = null;
  let maxCount = 0;
  let totalVotes = 0;
  
  frequencies.forEach(([vote, count]) => {
    if (count > maxCount) {
      maxCount = count;
      majorityVote = vote;
    }
    totalVotes += count;
  });

  // Sort frequencies by point value
  const sortedFrequencies = frequencies.sort(([a], [b]) => Number(a) - Number(b));

  if (frequencies.length === 0) return null;

  return (
    <div className="vote-frequency" style={{
      padding: '20px',
      marginBottom: '20px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      border: '1px solid #e0e7ef'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <h3 style={{ margin: 0, color: '#2d3a4a' }}>Vote Summary</h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            {majorityVote && (
              <div style={{
                backgroundColor: '#e8f5e9',
                padding: '8px 16px',
                borderRadius: '8px',
                color: '#2e7d32',
                fontWeight: 'bold'
              }}>
                Most Common: {majorityVote} ({maxCount} votes)
              </div>
            )}
            <div style={{
              backgroundColor: '#f3f6f9',
              padding: '8px 16px',
              borderRadius: '8px',
              color: '#1976d2',
              fontWeight: 'bold'
            }}>
              Participation: {totalVotes}/{totalMembers} ({Math.round((totalVotes/totalMembers) * 100)}%)
            </div>
          </div>
        </div>
        {/* Stats Row */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '15px',
          backgroundColor: '#f8fafc',
          padding: '12px',
          borderRadius: '8px'
        }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Max Votes</div>
            <div style={{ fontSize: '1.2rem', color: '#2d3a4a', fontWeight: 'bold' }}>{maxCount}</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Different Values</div>
            <div style={{ fontSize: '1.2rem', color: '#2d3a4a', fontWeight: 'bold' }}>{frequencies.length}</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Total Votes</div>
            <div style={{ fontSize: '1.2rem', color: '#2d3a4a', fontWeight: 'bold' }}>{totalVotes}</div>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {sortedFrequencies.map(([point, count]) => (
          <div key={point} style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: point === majorityVote ? '#f8f9fa' : '#fff',
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #e0e7ef',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            minWidth: '100px'
          }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              width: '100%' 
            }}>
              <span style={{ 
                fontSize: '1.2rem', 
                fontWeight: 'bold', 
                color: '#2d3a4a',
                marginBottom: '4px'
              }}>
                {point}
              </span>
              <span style={{ 
                color: '#666',
                fontSize: '0.9rem'
              }}>
                {count} vote{count !== 1 ? 's' : ''}
                <span style={{ 
                  color: '#999',
                  fontSize: '0.8rem',
                  marginLeft: '4px'
                }}>
                  ({Math.round((count / totalMembers) * 100)}%)
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoteFrequencyDisplay;
