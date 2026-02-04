const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;
const MAX_PARTICIPANTS = 5;

// Serve static files
app.use(express.static('public'));

// Host route - setup page to create participant links
app.get('/host', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'host-setup.html'));
});

// Participant route - check if has videos parameter
app.get('/participant', (req, res) => {
  const hasVideos = req.query.hasVideos === 'true';

  if (hasVideos) {
    // Redirect to participant setup page with videos
    res.sendFile(path.join(__dirname, 'public', 'participant-setup.html'));
  } else {
    // Normal participant flow
    res.sendFile(path.join(__dirname, 'public', 'participant.html'));
  }
});

// Meeting room - for both host and participants
app.get('/meeting', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'meeting.html'));
});

// Default route redirects to participant
app.get('/', (req, res) => {
  res.redirect('/participant');
});

// Store participants
const participants = new Map();
const waitingParticipants = new Map();
let hostId = null;
const chatHistory = [];

// Virtual participants (P2, P3) - controlled by host
const virtualParticipants = new Map();

io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  // Check if room is full
  if (participants.size >= MAX_PARTICIPANTS) {
    socket.emit('room-full');
    socket.disconnect();
    return;
  }

  // Don't automatically assign host here - wait for join-request with isHost flag

  // Handle join request (from waiting room)
  socket.on('join-request', (data) => {
    console.log('=== JOIN REQUEST ===');
    console.log('From:', data.name);
    console.log('isHost flag:', data.isHost);
    console.log('Role:', data.role || 'none');
    console.log('Socket ID:', socket.id);
    console.log('Current hostId:', hostId);

    // Set host if this is the first host request
    if (data.isHost && !hostId) {
      hostId = socket.id;
      socket.emit('you-are-host');
      console.log('>>> Host set:', socket.id);
    }

    if (data.isHost || socket.id === hostId) {
      // Host goes directly to meeting
      participants.set(socket.id, {
        id: socket.id,
        name: data.name,
        initials: data.initials,
        isHost: true,
        role: data.role || null
      });

      socket.emit('admitted');
      console.log('>>> Host admitted:', data.name);
    } else {
      // Participant waits for admission
      waitingParticipants.set(socket.id, {
        id: socket.id,
        name: data.name,
        initials: data.initials,
        isHost: false,
        role: data.role || null
      });

      socket.emit('waiting-for-admission');
      console.log('>>> Sent waiting-for-admission to participant');

      // Notify host
      if (hostId) {
        console.log('>>> Sending participant-waiting event to host:', hostId);
        io.to(hostId).emit('participant-waiting', {
          id: socket.id,
          name: data.name,
          initials: data.initials,
          role: data.role || null
        });
        console.log('>>> participant-waiting event sent');
      } else {
        console.log('>>> ERROR: No host to notify!');
      }

      console.log('>>> Participant waiting:', data.name);
    }
    console.log('===================');
  });

  // Host admits participant
  socket.on('admit-participant', () => {
    if (socket.id !== hostId) return;

    // Get the first waiting participant
    const [waitingId, waitingData] = Array.from(waitingParticipants.entries())[0];

    if (waitingId) {
      // Move to participants
      participants.set(waitingId, waitingData);
      waitingParticipants.delete(waitingId);

      // Notify participant they're admitted
      io.to(waitingId).emit('admitted');

      // NOTE: Don't send user-joined here! It will be sent when the participant calls 'entered-meeting'

      console.log('Participant admitted:', waitingData.name);
    }
  });

  // Host denies participant
  socket.on('deny-participant', () => {
    if (socket.id !== hostId) return;

    const [waitingId, waitingData] = Array.from(waitingParticipants.entries())[0];

    if (waitingId) {
      waitingParticipants.delete(waitingId);
      io.to(waitingId).emit('denied');
      console.log('Participant denied:', waitingData.name);
    }
  });

  // User entered meeting
  socket.on('entered-meeting', () => {
    const participant = participants.get(socket.id);
    if (!participant) {
      console.log('WARNING: entered-meeting called but participant not found for socket:', socket.id);
      return;
    }

    console.log('User entered meeting:', participant.name);

    // Send list of existing participants to the new user
    const existingParticipants = Array.from(participants.values())
      .filter(p => p.id !== socket.id); // Don't include self

    console.log(`Sending ${existingParticipants.length} existing participants to ${participant.name}`);
    socket.emit('existing-participants', existingParticipants);

    // Notify others about the new participant
    console.log(`Broadcasting user-joined for ${participant.name} to others`);
    socket.broadcast.emit('user-joined', participant);
  });

  // WebRTC signaling
  socket.on('offer', (data) => {
    socket.to(data.to).emit('offer', {
      offer: data.offer,
      from: socket.id
    });
  });

  socket.on('answer', (data) => {
    socket.to(data.to).emit('answer', {
      answer: data.answer,
      from: socket.id
    });
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.to).emit('ice-candidate', {
      candidate: data.candidate,
      from: socket.id
    });
  });

  // Chat message
  socket.on('chat-message', (data) => {
    const message = {
      sender: data.sender,
      text: data.text,
      timestamp: new Date().toISOString()
    };

    chatHistory.push(message);

    // Limit history to 100 messages
    if (chatHistory.length > 100) {
      chatHistory.shift();
    }

    // Broadcast to everyone
    io.emit('chat-message', message);

    console.log('Chat message from', data.sender);
  });

  // Camera toggle
  socket.on('camera-toggle', (data) => {
    socket.broadcast.emit('camera-toggle', {
      from: socket.id,
      enabled: data.enabled
    });
  });

  // Mic toggle
  socket.on('mic-toggle', (data) => {
    socket.broadcast.emit('mic-toggle', {
      from: socket.id,
      enabled: data.enabled
    });
  });

  // Fred slot participant mode change (from real Fred slot participant)
  socket.on('fred-slot-mode-change', (data) => {
    const participant = participants.get(socket.id);
    if (!participant || participant.role !== 'fred') {
      console.log('Non-Fred slot participant tried to send fred-slot-mode-change, ignoring');
      return;
    }

    console.log('Fred slot mode change from:', participant.name, 'mode:', data.mode);
    // Broadcast to all other participants
    socket.broadcast.emit('fred-slot-mode-change', data);
  });

  // Slot 2 state update (from host to all participants)
  socket.on('slot2-update', (data) => {
    // Only allow host to send slot2 updates
    if (socket.id !== hostId) {
      console.log('Non-host tried to send slot2-update, ignoring');
      return;
    }

    console.log('Slot 2 update from host:', data);
    // Broadcast to all other participants
    socket.broadcast.emit('slot2-update', data);
  });

  // Virtual participant registration (P2, P3) - from host
  socket.on('register-virtual-participant', (data) => {
    if (socket.id !== hostId) {
      console.log('Non-host tried to register virtual participant, ignoring');
      return;
    }

    console.log('Registering virtual participant:', data);
    virtualParticipants.set(data.virtualId, {
      virtualId: data.virtualId,
      name: data.name,
      initials: data.initials,
      hostSocketId: socket.id
    });

    // Notify all participants about the new virtual participant
    socket.broadcast.emit('virtual-participant-joined', {
      virtualId: data.virtualId,
      name: data.name,
      initials: data.initials
    });
  });

  // Virtual participant removed
  socket.on('remove-virtual-participant', (data) => {
    if (socket.id !== hostId) return;

    console.log('Removing virtual participant:', data.virtualId);
    virtualParticipants.delete(data.virtualId);

    // Notify all participants
    socket.broadcast.emit('virtual-participant-left', {
      virtualId: data.virtualId
    });
  });

  // WebRTC signaling for virtual participants (host -> participants)
  socket.on('virtual-offer', (data) => {
    // Host sends offer on behalf of virtual participant
    if (socket.id !== hostId) return;

    console.log(`Virtual offer from ${data.virtualId} to ${data.to}`);
    io.to(data.to).emit('virtual-offer', {
      offer: data.offer,
      virtualId: data.virtualId,
      from: socket.id
    });
  });

  socket.on('virtual-answer', (data) => {
    // Participant sends answer for virtual participant's offer
    console.log(`Virtual answer for ${data.virtualId} from ${socket.id}`);
    if (hostId) {
      io.to(hostId).emit('virtual-answer', {
        answer: data.answer,
        virtualId: data.virtualId,
        from: socket.id
      });
    }
  });

  socket.on('virtual-ice-candidate', (data) => {
    // ICE candidate for virtual peer connection
    if (data.toHost && hostId) {
      // From participant to host (for virtual peer)
      io.to(hostId).emit('virtual-ice-candidate', {
        candidate: data.candidate,
        virtualId: data.virtualId,
        from: socket.id
      });
    } else if (data.to) {
      // From host to participant (for virtual peer)
      io.to(data.to).emit('virtual-ice-candidate', {
        candidate: data.candidate,
        virtualId: data.virtualId,
        from: socket.id
      });
    }
  });

  // Virtual participant video update (from host to all participants)
  socket.on('virtual-video-update', (data) => {
    if (socket.id !== hostId) return;

    console.log('Virtual video update:', data);
    socket.broadcast.emit('virtual-video-update', data);
  });

  // Disconnect
  socket.on('disconnect', () => {
    const participant = participants.get(socket.id) || waitingParticipants.get(socket.id);

    if (participant) {
      console.log('User disconnected:', participant.name);

      participants.delete(socket.id);
      waitingParticipants.delete(socket.id);

      // If host disconnects, assign new host
      if (socket.id === hostId && participants.size > 0) {
        const newHostId = Array.from(participants.keys())[0];
        hostId = newHostId;
        const newHost = participants.get(newHostId);
        if (newHost) {
          newHost.isHost = true;
          io.to(newHostId).emit('you-are-host');
          console.log('New host:', newHost.name);
        }
      }

      // Notify others
      io.emit('user-left', { id: socket.id });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
  console.log(`Maximum ${MAX_PARTICIPANTS} participants allowed`);
});
