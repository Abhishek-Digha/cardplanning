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
const allowedOrigins = [
  'http://localhost:3000',
  'https://abhishek-digha.github.io',
  'https://abhishek-digha.github.io/cardplanning'
];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

const io = new Server(server, {
  cors: { origin: allowedOrigins },
   pingTimeout: 600000,    // 30 seconds
  pingInterval: 300000    // 10 seconds
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
    this.voteFrequency = {};
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
  
  // Validate input
  if (!sessionCode || !userName) {
    return res.status(400).json({error:'Session code and user name are required'});
  }
  
  const session = [...sessions.values()].find(s=>s.code===sessionCode.toUpperCase());
  if(!session) return res.status(404).json({error:'Session not found'});
  
  const userId = uuidv4();
  const user = {id:userId, name:userName, isAdmin:false};
  
  try {
    session.members.push(user);
    io.to(session.id).emit('memberJoined', user);
    res.json({
      sessionId: session.id,
      sessionCode: session.code,
      userId,
      user
    });
  } catch (error) {
    console.error('Error joining session:', error);
    res.status(500).json({error:'Failed to join session'});
  }
});

// Get session
app.get('/api/sessions/:id',(req,res)=>{
  const session = sessions.get(req.params.id);
  if(!session) return res.status(404).json({error:'Session not found'});
  
  // Deep clone and convert votes Map to object for each story
  const sessionObj = {
    id: session.id,
    code: session.code,
    adminId: session.adminId,
    members: session.members,
    activeStoryId: session.activeStoryId,
    stories: session.stories.map(story => ({
      ...story,
      votes: Object.fromEntries(story.votes),
      voteFrequency: story.voteFrequency
    }))
  };
  
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
  const story = new Story(title,description);
  session.stories.push(story);
  session.activeStoryId = story.id;
  
  // Convert story votes Map to plain object for sending
  const storyToSend = {
    ...story,
    votes: {},
    voteFrequency: {}
  };
  
  io.to(session.id).emit('storyCreated', storyToSend);
  io.to(session.id).emit('activeStoryChanged', story.id);
  res.json(storyToSend);
});

// Vote
app.post('/api/sessions/:id/vote',(req,res)=>{
  const { userId,storyId,points }=req.body;
  const session=sessions.get(req.params.id);
  const story=session.stories.find(s=>s.id===storyId);
  if(story.isRevealed) return res.status(400).json({error:'Already revealed'});
  
  story.votes.set(userId,points);
  
  // Update vote frequency
  story.voteFrequency = {};
  const votes = Array.from(story.votes.values());
  votes.forEach(vote => {
    story.voteFrequency[vote] = (story.voteFrequency[vote] || 0) + 1;
  });
  
  io.to(session.id).emit('voteCountChanged',{
    storyId,
    voteCount: story.votes.size,
    totalMembers: session.members.length,
    voteFrequency: story.voteFrequency
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
  
  // Find the majority vote (most common) from existing vote frequency
  let majorityVote = null;
  let maxCount = 0;
  Object.entries(story.voteFrequency).forEach(([vote, count]) => {
    if (count > maxCount) {
      maxCount = count;
      majorityVote = vote;
    }
  });
  
  io.to(session.id).emit('votesRevealed', {
    storyId: story.id,
    votes: Object.fromEntries(story.votes),
    voteFrequency: story.voteFrequency,
    majorityVote
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
  story.votes.clear();
  story.voteFrequency = {};
  story.isRevealed=false;
  io.to(session.id).emit('votesCleared',story.id);
  res.json({success:true});
});

// Socket.io
io.on('connection', socket => {
  // Handle session join with user data
  socket.on('joinSession', async ({ sessionId, userId }) => {
    if (!sessionId || !userId) return;
    
    const session = sessions.get(sessionId);
    if (!session) return;
    
    // Join the session room
    await socket.join(sessionId);
    
    // Send current session state to the reconnecting user
    const sessionState = {
      members: session.members,
      stories: session.stories.map(story => ({
        ...story,
        votes: Object.fromEntries(story.votes),
        voteFrequency: story.voteFrequency
      })),
      activeStoryId: session.activeStoryId
    };
    
    socket.emit('sessionState', sessionState);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    // Socket.IO automatically handles room cleanup
  });
});

server.listen(5000,()=>console.log('Server running on port 5000'));
