// ...existing code...
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000' }
});

// In-memory stores
const sessions = new Map();

class Session {
  constructor(adminId,name){
    this.id = uuidv4();
    this.code = Math.random().toString(36).substr(2,6).toUpperCase();
    this.adminId = adminId;
    this.members = [{id:adminId,name,isAdmin:true}];
    this.stories = [];
    this.activeStoryId = null;
  }
}
class Story {
  constructor(title,desc){
    this.id = uuidv4();
    this.title = title;
    this.description = desc;
    this.votes = new Map();
    this.isRevealed = false;
  }
}

// Create session
app.post('/api/sessions', (req,res)=>{
  const { userName } = req.body;
  const userId = uuidv4();
  const session = new Session(userId,userName);
  sessions.set(session.id,session);
  res.json({
    sessionId:session.id,
    sessionCode:session.code,
    userId,
    user:{id:userId,name:userName,isAdmin:true}
  });
});

// Join session
app.post('/api/sessions/join',(req,res)=>{
  const { sessionCode,userName } = req.body;
  const session = [...sessions.values()].find(s=>s.code===sessionCode);
  if(!session) return res.status(404).json({error:'Session not found'});
  const userId = uuidv4(), user={id:userId,name:userName,isAdmin:false};
  session.members.push(user);
  io.to(session.id).emit('memberJoined',user);
  res.json({sessionId:session.id,sessionCode,userId,user});
});

// Get session
app.get('/api/sessions/:id',(req,res)=>{
  const session = sessions.get(req.params.id);
  if(!session) return res.status(404).json({error:'Session not found'});
  // Deep clone and convert votes Map to object for each story
  const sessionObj = JSON.parse(JSON.stringify(session));
  sessionObj.stories = session.stories.map(story => ({
    ...story,
    votes: Object.fromEntries(story.votes)
  }));
  res.json(sessionObj);
});

// Create story
app.post('/api/sessions/:id/stories',(req,res)=>{
  const { title,description,userId } = req.body;
  const session = sessions.get(req.params.id);
  console.log('DEBUG: Incoming userId:', userId);
  console.log('DEBUG: Session members:', session.members);
  const member = session.members.find(m=>m.id===userId);
  if(!member?.isAdmin) {
    console.log('DEBUG: Member not admin or not found:', member);
    return res.status(403).json({error:'Only admin'});
  }
  const story=new Story(title,description);
  session.stories.push(story);
  session.activeStoryId = story.id;
  io.to(session.id).emit('storyCreated',story);
  io.to(session.id).emit('activeStoryChanged',story.id);
  res.json(story);
});

// Vote
app.post('/api/sessions/:id/vote',(req,res)=>{
  const { userId,storyId,points }=req.body;
  const session=sessions.get(req.params.id);
  const story=session.stories.find(s=>s.id===storyId);
  if(story.isRevealed) return res.status(400).json({error:'Already revealed'});
  story.votes.set(userId,points);
  io.to(session.id).emit('voteCountChanged',{
    storyId, voteCount:story.votes.size, totalMembers:session.members.length
  });
  res.json({success:true});
});

// Reveal votes
app.post('/api/sessions/:id/stories/:sid/reveal',(req,res)=>{
  const { userId } = req.body;
  const session=sessions.get(req.params.id);
  const member=session.members.find(m=>m.id===userId);
  if(!member?.isAdmin) return res.status(403).json({error:'Only admin'});
  const story=session.stories.find(s=>s.id===req.params.sid);
  story.isRevealed=true;
  io.to(session.id).emit('votesRevealed',{
    storyId:story.id,
    votes:Object.fromEntries(story.votes)
  });
  res.json({success:true});
});

// Clear votes
app.post('/api/sessions/:id/stories/:sid/clear',(req,res)=>{
  const { userId } = req.body;
  const session=sessions.get(req.params.id);
  const member=session.members.find(m=>m.id===userId);
  if(!member?.isAdmin) return res.status(403).json({error:'Only admin'});
  const story=session.stories.find(s=>s.id===req.params.sid);
  story.votes.clear(); story.isRevealed=false;
  io.to(session.id).emit('votesCleared',story.id);
  res.json({success:true});
});

// Socket.io
io.on('connection',socket=>{
  socket.on('joinSession',sid=>socket.join(sid));
});

server.listen(5000,()=>console.log('Server running on port 5000'));
