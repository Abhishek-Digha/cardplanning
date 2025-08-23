import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { sessionAPI } from '../utils/api';

const SessionContext = createContext();
const initialState = {
  session:null, user:null, socket:null,
  stories:[], activeStory:null,
  votes:{}, voteCount:0, totalMembers:0,
  isRevealed:false
};

function reducer(state,action){
  switch(action.type){
    case 'SET': {
      // Always ensure stories is an array if present
      let payload = {...action.payload};
      if ('stories' in payload && !Array.isArray(payload.stories)) {
        payload.stories = [];
      }
      return {...state, ...payload};
    }
    case 'ADD_MEMBER': return {
      ...state,
      session:{...state.session,members:[...state.session.members,action.payload]}
    };
    case 'ADD_STORY':
      // Add new story to the beginning of the array
      return {...state,stories:[action.payload, ...state.stories]};
    case 'SET_ACTIVE': return {...state,activeStory:action.payload};
    case 'SET_VOTE_COUNT':
      return {...state,voteCount:action.payload.voteCount,totalMembers:action.payload.totalMembers};
    case 'SET_VOTES': return {...state,votes:action.payload};
    case 'SET_REVEALED': return {...state,isRevealed:action.payload};
    // CLEAR_VOTES feature removed
    default: return state;
  }
}


  export function SessionProvider({ children }) {
    const [state,dispatch] = useReducer(reducer,initialState);
  const sessionIdRef = useRef(null);
  sessionIdRef.current = state.session?.id;

  useEffect(()=>{
    const socket = io('https://cardplanning-2.onrender.com');
    dispatch({type:'SET',payload:{socket}});

   socket.on('memberJoined', async () => {
  if (sessionIdRef.current) {
    const updatedSession = await sessionAPI.getSession(sessionIdRef.current);

    // Always show active story first
    let stories = updatedSession.stories;
    let newActiveStory = null;
    if (updatedSession.activeStoryId) {
      newActiveStory = updatedSession.stories.find(
        (s) => s.id === updatedSession.activeStoryId
      ) || null;
      if (newActiveStory) {
        stories = [newActiveStory, ...updatedSession.stories.filter(s => s.id !== newActiveStory.id)];
      }
    }

    const votes = newActiveStory?.votes || {};
    const voteCount =
      typeof newActiveStory?.voteCount === 'number' && !isNaN(newActiveStory.voteCount)
        ? newActiveStory.voteCount
        : 0;
    const totalMembers = Array.isArray(updatedSession.members)
      ? updatedSession.members.length
      : 0;
    const isRevealed = !!newActiveStory?.isRevealed; // ✅ ensure new joiners respect revealed state

    dispatch({
      type: 'SET',
      payload: {
        session: updatedSession,
        stories,
        activeStory: newActiveStory,
        votes,
        voteCount,
        totalMembers,
        isRevealed
      },
    });
  }
});

    socket.on('storyCreated',async()=>{
      if(sessionIdRef.current) {
        const updatedSession = await sessionAPI.getSession(sessionIdRef.current);
        let stories = [...updatedSession.stories.filter(Boolean)];
        let newActiveStory = null;
        if (updatedSession.activeStoryId) {
          newActiveStory = stories.find(s => s.id === updatedSession.activeStoryId) || null;
        }
        if (!newActiveStory && stories.length > 0) {
          newActiveStory = stories[stories.length - 1];
        }
        // Always keep the active story at the top, no duplicates
        if (newActiveStory) {
          stories = [newActiveStory, ...stories.filter(s => s.id !== newActiveStory.id)];
        }
        // Use backend voteCount and totalMembers
        const voteCount = typeof newActiveStory?.voteCount === 'number' && !isNaN(newActiveStory.voteCount) ? newActiveStory.voteCount : 0;
        const totalMembers = Array.isArray(updatedSession.members) ? updatedSession.members.length : 0;
        dispatch({type:'SET',payload:{
          session: { ...updatedSession },
          stories: [...stories],
          activeStory: newActiveStory,
          votes: {},
          voteCount,
          totalMembers,
          isRevealed: false
        }});
      }
    });
    socket.on('activeStoryChanged',async id=>{
      if(sessionIdRef.current) {
        const updatedSession = await sessionAPI.getSession(sessionIdRef.current);
        const newActiveStory = updatedSession.stories.find(s=>s.id===id) || null;
        let stories = [...updatedSession.stories.filter(Boolean)];
        // Always ensure the active story is present in the stories array, no duplicates
        if (newActiveStory) {
          stories = [newActiveStory, ...stories.filter(s => s.id !== newActiveStory.id)];
        }
        dispatch({
          type: 'SET',
          payload: {
            session: updatedSession,
            stories,
            activeStory: newActiveStory,
            votes: newActiveStory?.votes || {},
            voteCount: newActiveStory?.voteCount || 0,
            isRevealed: !!newActiveStory?.isRevealed
          }
        });
      }
    });
    socket.on('voteCountChanged',data=>{
      // Fetch the latest session data and always keep the active story in the stories array
      (async () => {
        if (sessionIdRef.current) {
          const updatedSession = await sessionAPI.getSession(sessionIdRef.current);
          let stories = [...updatedSession.stories.filter(Boolean)];
          let newActiveStory = null;
          if (updatedSession.activeStoryId) {
            newActiveStory = stories.find(s => s.id === updatedSession.activeStoryId) || null;
          }
          if (!newActiveStory && stories.length > 0) {
            newActiveStory = stories[stories.length - 1];
          }
          // Always keep the active story at the top, no duplicates
          if (newActiveStory) {
            stories = [newActiveStory, ...stories.filter(s => s.id !== newActiveStory.id)];
          }
          // Use the latest votes, voteCount, and totalMembers from the backend
          const votes = newActiveStory?.votes || {};
          // Always use the backend's voteCount for the active story, fallback to 0 if undefined
          const voteCount = (typeof newActiveStory?.voteCount === 'number' && !isNaN(newActiveStory.voteCount)) ? newActiveStory.voteCount : 0;
          const totalMembers = Array.isArray(updatedSession.members) ? updatedSession.members.length : 0;
          const isRevealed = !!newActiveStory?.isRevealed;
          dispatch({
            type: 'SET',
            payload: {
              session: updatedSession,
              stories,
              activeStory: newActiveStory,
              votes,
              voteCount,
              totalMembers,
              isRevealed
            }
          });
        }
      })();
    });
    socket.on('votesRevealed',data=>{
      // After votes are revealed, fetch the latest session and keep the active story if present
      (async () => {
        if (sessionIdRef.current) {
          const updatedSession = await sessionAPI.getSession(sessionIdRef.current);
          let stories = [...updatedSession.stories.filter(Boolean)];
          let newActiveStory = null;
          if (updatedSession.activeStoryId) {
            newActiveStory = stories.find(s => s.id === updatedSession.activeStoryId) || null;
          }
          if (!newActiveStory && stories.length > 0) {
            newActiveStory = stories[stories.length - 1];
          }
          // Always keep the active story at the top, no duplicates
          if (newActiveStory) {
            stories = [newActiveStory, ...stories.filter(s => s.id !== newActiveStory.id)];
          }
          // Use backend values for votes, voteCount, and totalMembers
          const votes = newActiveStory?.votes || {};
          const voteCount = (typeof newActiveStory?.voteCount === 'number' && !isNaN(newActiveStory.voteCount)) ? newActiveStory.voteCount : 0;
          const totalMembers = Array.isArray(updatedSession.members) ? updatedSession.members.length : 0;
          const isRevealed = !!newActiveStory?.isRevealed;
          dispatch({
            type: 'SET',
            payload: {
              session: updatedSession,
              stories,
              activeStory: newActiveStory,
              votes,
              voteCount,
              totalMembers,
              isRevealed
            }
          });
        }
      })();
    });
    // votesCleared handler removed (feature deprecated)

    return ()=>socket.disconnect();
  },[]);

  return (
    <SessionContext.Provider value={{...state,dispatch}}>
      {children}

    </SessionContext.Provider>
  );
}

export function useSession(){
  return useContext(SessionContext);
}
