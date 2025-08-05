import React from 'react';
import { useSession } from '../contexts/SessionContext';

export default function MembersList(){
  const {session} = useSession();
  return (
    <div className="members-list">
      <h3 style={{fontWeight:700, fontSize:'1.1rem', color:'#2d3a4a', letterSpacing:1, marginBottom:10}}>Members ({session.members.length})</h3>
      <table style={{width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: 'white', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.03)'}}>
        <thead style={{background: '#e0e7ef'}}>
          <tr>
            <th style={{padding: '8px 12px', textAlign: 'left', color: '#2d3a4a', fontWeight: 600, borderBottom: '1px solid #d1d5db'}}>Name</th>
            <th style={{padding: '8px 12px', textAlign: 'center', color: '#2d3a4a', fontWeight: 600, borderBottom: '1px solid #d1d5db'}}>Role</th>
          </tr>
        </thead>
        <tbody>
          {session.members.map((m, idx) => (
            <tr key={m.id} style={{background: idx % 2 === 0 ? '#f8fafc' : 'white'}}>
              <td style={{padding: '8px 12px', borderBottom: '1px solid #f1f5f9'}}>{m.name}</td>
              <td style={{padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #f1f5f9'}}>{m.isAdmin ? <span style={{color:'#6366f1',fontWeight:700}}>Admin</span> : 'Member'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
