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
    const socket = io('http://localhost:5000');
    dispatch({type:'SET',payload:{socket}});

    socket.on('memberJoined',async()=>{
      if(sessionIdRef.current) {
        const updatedSession = await sessionAPI.getSession(sessionIdRef.current);
        // Always show active story first
        let stories = updatedSession.stories;
        if (updatedSession.activeStoryId) {
          const activeStory = updatedSession.stories.find(s => s.id === updatedSession.activeStoryId);
          if (activeStory) {
            stories = [activeStory, ...updatedSession.stories.filter(s => s.id !== activeStory.id)];
          }
        }
        dispatch({type:'SET',payload:{session: updatedSession, stories}});
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
        // Move the new/active story to the top, but keep all stories
        if (newActiveStory) {
          stories = [newActiveStory, ...stories.filter(s => s.id !== newActiveStory.id)];
        }
        dispatch({type:'SET',payload:{
          session: { ...updatedSession },
          stories: [...stories],
          activeStory: newActiveStory,
          votes: {},
          voteCount: 0,
          totalMembers: 0,
          isRevealed: false
        }});
      }
    });
    socket.on('activeStoryChanged',async id=>{
      if(sessionIdRef.current) {
        const updatedSession = await sessionAPI.getSession(sessionIdRef.current);
        const newActiveStory = updatedSession.stories.find(s=>s.id===id) || null;
        // Always set votes to the story's votes, regardless of reveal state
        // Move the active story to the top of the list
        const stories = [newActiveStory, ...updatedSession.stories.filter(s => s.id !== newActiveStory.id)];
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
      dispatch({type:'SET_VOTE_COUNT',payload:data});
    });
    socket.on('votesRevealed',data=>{
      // Remove the active story from the stories array after votes are revealed
      dispatch((prevState) => {
        const activeStoryId = prevState.activeStory?.id;
        // Remove the active story from the stories array
        const remainingStories = prevState.stories.filter(story => story.id !== activeStoryId);
        // Set the next story as active, or null if none left
        const nextActiveStory = remainingStories.length > 0 ? remainingStories[0] : null;
        return {
          type: 'SET',
          payload: {
            stories: remainingStories,
            activeStory: nextActiveStory,
            votes: {},
            voteCount: 0,
            totalMembers: prevState.totalMembers,
            isRevealed: false
          }
        };
      });
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
