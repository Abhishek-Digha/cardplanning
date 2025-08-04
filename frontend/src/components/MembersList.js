import React from 'react';
import { useSession } from '../contexts/SessionContext';

export default function MembersList(){
  const {session} = useSession();
  return (
    <div className="members-list">
      <h3>Members ({session.members.length})</h3>
      {session.members.map(m=>(
        <div key={m.id} className="member">
          {m.name} {m.isAdmin && <span className="admin-badge">Admin</span>}
        </div>
      ))}
    </div>
  );
}
