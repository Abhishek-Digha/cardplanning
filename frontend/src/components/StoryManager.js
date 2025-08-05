import React, { useState } from 'react';
import { useSession } from '../contexts/SessionContext';
import { sessionAPI } from '../utils/api';

export default function StoryManager(){
  const {session,user,stories,activeStory,dispatch} = useSession();
  const [open,setOpen]=useState(false);
  const [title,setTitle]=useState('');
  const [desc,setDesc]=useState('');

  const handle = async e=>{
    e.preventDefault();
    if(!title) return;
    await sessionAPI.createStory(session.id,title,desc,user.id);
    // Do not update context here; rely on socket event for real-time update
    setTitle('');setDesc('');setOpen(false);
  };

  return (
    <div className="story-manager">
      {user.isAdmin && (
        <div style={{marginBottom: 16, textAlign: 'center'}}>
          <button 
            onClick={()=>setOpen(!open)}
            style={{padding:'10px 24px',background:'#1976d2',color:'#fff',border:'none',borderRadius:4,cursor:'pointer',fontWeight:'bold',fontSize:18,marginBottom:8}}
          >
            + Create Card
          </button>
        </div>
      )}
      {open && (
        <form onSubmit={handle} style={{background:'#f5f5f5',padding:20,borderRadius:8,margin:'16px 0',boxShadow:'0 2px 8px #0001',maxWidth:400,marginLeft:'auto',marginRight:'auto'}}>
          <div style={{marginBottom:12}}>
            <input 
              placeholder="Title"
              value={title}
              onChange={e=>setTitle(e.target.value)}
              style={{width:'100%',padding:8,fontSize:16,borderRadius:4,border:'1px solid #ccc'}}
              required
            />
          </div>
          <div style={{marginBottom:12}}>
            <textarea
              placeholder="Description"
              value={desc}
              onChange={e=>setDesc(e.target.value)}
              style={{width:'100%',padding:8,fontSize:15,borderRadius:4,border:'1px solid #ccc',minHeight:60}}
            />
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
            <button type="button" onClick={()=>setOpen(false)} style={{padding:'6px 16px',background:'#eee',border:'none',borderRadius:4,cursor:'pointer'}}>Cancel</button>
            <button type="submit" style={{padding:'6px 16px',background:'#43a047',color:'#fff',border:'none',borderRadius:4,cursor:'pointer',fontWeight:'bold'}}>Create</button>
          </div>
        </form>
      )}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <h3>Stories</h3>
      </div>
      <div style={{marginTop:12}}>
        {stories.map(s=>(
          <div 
            key={s.id} 
            className={`story-item ${activeStory?.id===s.id?'active':''}`}
            style={{
              background:activeStory?.id===s.id?'#e3f2fd':'#fff',
              border:'1px solid #ddd',
              borderRadius:6,
              padding:'10px 16px',
              marginBottom:10,
              boxShadow:activeStory?.id===s.id?'0 2px 8px #1976d233':'0 1px 2px #0001',
              cursor:'pointer',
              transition:'box-shadow 0.2s',
              position:'relative'
            }}
            onClick={async ()=>{
              // Fetch latest session to get up-to-date members and story state
              const updatedSession = await sessionAPI.getSession(session.id);
              const latestStory = updatedSession.stories.find(st => st.id === s.id) || s;
              dispatch({type:'SET_ACTIVE',payload:latestStory});
              dispatch({type:'SET',payload:{
                votes: latestStory.votes || {},
                isRevealed: !!latestStory.isRevealed,
                session: { ...session, members: updatedSession.members }
              }});
            }}
          >
            <h4 style={{margin:'0 0 4px 0',fontWeight:600}}>{s.title}</h4>
            {s.description && <p style={{margin:0,color:'#555'}}>{s.description}</p>}
            {activeStory?.id===s.id && <span style={{position:'absolute',top:10,right:16,background:'#1976d2',color:'#fff',padding:'2px 8px',borderRadius:4,fontSize:12}}>Active</span>}
            {/* No voting history UI, restored to original */}
          </div>
        ))}
      </div>
    </div>
  );
}