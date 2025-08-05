import axios from 'axios';
const API = axios.create({baseURL:'https://cardplanning-2.onrender.com/api'});

export const sessionAPI = {
  createSession: userName => API.post('/sessions',{userName}).then(r=>r.data),
  joinSession: (code,name)=>API.post('/sessions/join',{sessionCode:code,userName:name}).then(r=>r.data),
  getSession: id=>API.get(`/sessions/${id}`).then(r=>r.data),
  createStory:(sid,title,desc,uid)=>
    API.post(`/sessions/${sid}/stories`,{title,description:desc,userId:uid}).then(r=>r.data),
  vote:(sid,uid,storyId,points)=>
    API.post(`/sessions/${sid}/vote`,{userId:uid,storyId,points}).then(r=>r.data),
  revealVotes:(sid,storyId,uid)=>
    API.post(`/sessions/${sid}/stories/${storyId}/reveal`,{userId:uid}).then(r=>r.data),

  clearVotes:(sid,storyId,uid)=>
    API.post(`/sessions/${sid}/stories/${storyId}/clear`,{userId:uid}).then(r=>r.data),

};
