// Teams Clone - Complete Flow v4
const socket = io();

// WebRTC Configuration - multiple STUN + free TURN for reliability
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        }
    ]
};

// Fix for Firefox and other browsers
const RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
const RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription;
const RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate;

// Global State
let currentScreen = 'splash'; // splash, setup, waiting, meeting
let userName = '';
let userInitials = '';
let isHost = false;
let isCameraOn = false;
let isMicOn = true;
let localStream = null;
let meetingStartTime = null;
let timerInterval = null;

// Host video control
let hostVideoMode = 'webcam'; // webcam, video1, video2, stop
let hostVideo1URL = null;
let hostVideo2URL = null;
let hostVideo1Element = null;
let hostVideo2Element = null;

// Slot 2 control (Fred vs Participant 3)
let slot2Mode = 'fred'; // 'fred' or 'participant3'
let participant3Name = '';
let participant3Initials = '';
let participant3VideoMode = 'stop'; // video1, video2, stop

// Participant 3 video elements (separate from host videos)
let p3Video1URL = null;
let p3Video2URL = null;
let p3Video1Element = null;
let p3Video2Element = null;

// Participant 2 video elements (uploaded by host for P2)
let p2Video1URL = null;
let p2Video2URL = null;
let p2Video1Element = null;
let p2Video2Element = null;
let p2VideoMode = 'stop'; // video1, video2, stop
let p2Name = '';
let p2Initials = 'P2';

// Participant with videos control
let isParticipantWithVideos = false;
let participantVideoMode = 'webcam';
let participantRole = null; // 'fred' for Fred slot replacement
let myFredMode = 'fred'; // 'fred' or 'participant' - for Fred slot participant's display mode
let myParticipantDisplayName = ''; // Custom name when in participant mode
let participantVideo1URL = null;
let participantVideo2URL = null;
let participantVideo1Element = null;
let participantVideo2Element = null;

// Peer-to-peer connections
const peers = new Map();
const remoteStreams = new Map();
const participants = new Map(); // Store participant info

// Flag to prevent Sarah's message from being added multiple times
let sarahMessageAdded = false;

// Flag to prevent entering meeting multiple times
let hasEnteredMeeting = false;

// DOM Elements
const splashScreen = document.getElementById('splash-screen');
const setupScreen = document.getElementById('setup-screen');
const waitingRoom = document.getElementById('waiting-room');
const mainContainer = document.getElementById('main-container');

// Setup screen elements
const setupVideo = document.getElementById('setup-video');
const setupVideoOff = document.getElementById('setup-video-off');
const setupCameraToggle = document.getElementById('setup-camera-toggle');
const joinNowBtn = document.getElementById('join-now-btn');

// Waiting room elements
const waitingAvatar = document.getElementById('waiting-avatar');
const waitingMessage = document.getElementById('waiting-message');
const participantNameSpan = document.getElementById('participant-name');
const admissionNotification = document.getElementById('admission-notification');
const admitBtn = document.getElementById('admit-btn');
const denyBtn = document.getElementById('deny-btn');

// Main meeting elements
const videoGrid = document.getElementById('video-grid');
const meetingChatMessages = document.getElementById('meeting-chat-messages');
const meetingChatInput = document.getElementById('meeting-chat-input');
const sendMessageBtn = document.getElementById('send-message-btn');
const meetingTimer = document.getElementById('meeting-timer');
const mainCameraBtn = document.getElementById('main-camera-btn');
const mainMicBtn = document.getElementById('main-mic-btn');
// const currentUserName = document.getElementById('current-user-name'); // Removed from HTML

// Meeting admission notification (for host in main meeting)
const meetingAdmissionNotification = document.getElementById('meeting-admission-notification');
const meetingAdmitBtn = document.getElementById('meeting-admit-btn');
const meetingDenyBtn = document.getElementById('meeting-deny-btn');
const meetingGuestName = document.getElementById('meeting-guest-name');

// Leave buttons
const topLeaveBtn = document.querySelector('.top-leave-btn');
const waitingLeaveBtn = document.querySelector('.waiting-leave-btn');

// Chat toggle button
const chatToggleBtn = document.getElementById('chat-toggle-btn');

// Initialize
init();

function init() {
    // Check if user is host from sessionStorage
    if (sessionStorage.getItem('isHost') === 'true') {
        isHost = true;
        userName = sessionStorage.getItem('userName') || 'Host';
        userInitials = getInitials(userName);

        // Load P2 and P3 names from sessionStorage
        p2Name = sessionStorage.getItem('participant2Name') || 'Participant 2';
        p2Initials = getInitials(p2Name);
        participant3Name = sessionStorage.getItem('participant3Name') || '';
        participant3Initials = participant3Name ? getInitials(participant3Name) : 'P3';

        console.log('Loaded P2 name:', p2Name);
        console.log('Loaded P3 name:', participant3Name);

        // Load host videos from IndexedDB
        loadVideosFromIndexedDB('host');
    } else if (sessionStorage.getItem('isParticipantWithVideos') === 'true') {
        // Participant with videos
        isParticipantWithVideos = true;
        userName = sessionStorage.getItem('userName') || 'Participant';
        userInitials = getInitials(userName);
        participantRole = sessionStorage.getItem('participantRole') || null;

        console.log('Participant role:', participantRole);

        // Load participant videos from IndexedDB
        loadVideosFromIndexedDB('participant');
    } else {
        // Regular participant (Client) - get name from URL or joinToken
        const urlParams = new URLSearchParams(window.location.search);
        let nameFromUrl = urlParams.get('name');

        // Check for joinToken (Teams-like URL format)
        if (!nameFromUrl && urlParams.has('joinToken')) {
            try {
                const tokenData = JSON.parse(atob(urlParams.get('joinToken')));
                nameFromUrl = tokenData.name || null;
            } catch(e) {
                console.log('Invalid joinToken');
            }
        }

        if (nameFromUrl) {
            userName = nameFromUrl;
            userInitials = getInitials(userName);
            console.log('Regular participant from URL:', userName);
        }
    }

    // Start with splash screen
    showSplashScreen();

    // Socket events
    setupSocketEvents();

    // Virtual participant socket events
    initVirtualParticipantListeners();

    // Event listeners
    if (setupCameraToggle) setupCameraToggle.addEventListener('click', toggleSetupCamera);
    if (joinNowBtn) joinNowBtn.addEventListener('click', joinWaitingRoom);

    if (admitBtn) admitBtn.addEventListener('click', admitParticipant);
    if (denyBtn) denyBtn.addEventListener('click', denyParticipant);

    // Meeting admission buttons (for host in main meeting)
    if (meetingAdmitBtn) meetingAdmitBtn.addEventListener('click', admitParticipant);
    if (meetingDenyBtn) meetingDenyBtn.addEventListener('click', denyParticipant);

    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', sendChatMessage);
    }

    if (meetingChatInput) {
        meetingChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }

    if (mainCameraBtn) mainCameraBtn.addEventListener('click', toggleMainCamera);
    if (mainMicBtn) mainMicBtn.addEventListener('click', toggleMainMic);

    // Leave buttons
    if (topLeaveBtn) topLeaveBtn.addEventListener('click', leaveMeeting);
    if (waitingLeaveBtn) waitingLeaveBtn.addEventListener('click', leaveMeeting);

    // Chat toggle button
    if (chatToggleBtn) chatToggleBtn.addEventListener('click', toggleChat);

    // Chat close button
    const closeChatBtn = document.getElementById('close-chat-btn');
    if (closeChatBtn) closeChatBtn.addEventListener('click', toggleChat);

    // Waiting room dropdown toggles
    const waitingCameraDropdownBtn = document.getElementById('waiting-camera-dropdown-btn');
    const waitingMicDropdownBtn = document.getElementById('waiting-mic-dropdown-btn');
    if (waitingCameraDropdownBtn) waitingCameraDropdownBtn.addEventListener('click', toggleWaitingCameraDropdown);
    if (waitingMicDropdownBtn) waitingMicDropdownBtn.addEventListener('click', toggleWaitingMicDropdown);

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        const cameraMenu = document.getElementById('waiting-camera-menu');
        const micMenu = document.getElementById('waiting-mic-menu');
        if (cameraMenu && !e.target.closest('.waiting-control-dropdown')) {
            cameraMenu.style.display = 'none';
        }
        if (micMenu && !e.target.closest('.waiting-control-dropdown')) {
            micMenu.style.display = 'none';
        }
    });
}

// ============================================
// STEP 1: SPLASH SCREEN
// ============================================

function showSplashScreen() {
    currentScreen = 'splash';
    splashScreen.style.display = 'flex';
    setupScreen.style.display = 'none';
    waitingRoom.style.display = 'none';
    mainContainer.style.display = 'none';

    // Auto-transition to setup after 2.5 seconds
    setTimeout(() => {
        showSetupScreen();
    }, 2500);
}

// ============================================
// STEP 2: SETUP SCREEN
// ============================================

async function showSetupScreen() {
    currentScreen = 'setup';
    splashScreen.style.display = 'none';
    setupScreen.style.display = 'flex';
    waitingRoom.style.display = 'none';
    mainContainer.style.display = 'none';

    // Get user name from URL parameter, joinToken, OR sessionStorage (don't overwrite if already set!)
    if (!userName) {
        const urlParams = new URLSearchParams(window.location.search);
        let nameFromParams = urlParams.get('name');

        // Check for joinToken (Teams-like URL format)
        if (!nameFromParams && urlParams.has('joinToken')) {
            try {
                const tokenData = JSON.parse(atob(urlParams.get('joinToken')));
                nameFromParams = tokenData.name || null;
            } catch(e) {}
        }

        userName = nameFromParams || sessionStorage.getItem('userName') || 'Guest';
        userInitials = getInitials(userName);
    }

    // Update username if element exists
    const usernameElement = document.getElementById('setup-username');
    if (usernameElement) {
        usernameElement.textContent = userName;
    }

    // Update meeting time with current system date and time
    updateMeetingDateTime();

    // Try to get user media (video + audio, fallback to audio-only)
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });

        setupVideo.srcObject = localStream;
        setupVideoOff.style.display = 'none';
        isCameraOn = true;
        updateSetupCameraButton();
    } catch (error) {
        console.log('Camera+Audio failed, trying audio-only:', error);
        isCameraOn = false;
        setupVideoOff.style.display = 'flex';
        updateSetupCameraButton();
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('Audio-only stream captured successfully');
        } catch (audioError) {
            console.log('No media available at all:', audioError);
        }
    }
}

async function toggleSetupCamera() {
    if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            isCameraOn = videoTrack.enabled;

            if (isCameraOn) {
                setupVideoOff.style.display = 'none';
            } else {
                setupVideoOff.style.display = 'flex';
            }

            updateSetupCameraButton();
        }
    } else {
        // Si localStream n'existe pas, essayer de l'obtenir
        try {
            localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            setupVideo.srcObject = localStream;
            setupVideoOff.style.display = 'none';
            isCameraOn = true;
            updateSetupCameraButton();
        } catch (error) {
            console.log('Camera+Audio failed, trying audio-only:', error);
            try {
                localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log('Audio-only stream captured successfully');
            } catch (e) {}
            isCameraOn = false;
            updateSetupCameraButton();
        }
    }
}


function updateSetupCameraButton() {
    // Update camera toggle button icon
    if (setupCameraToggle) {
        const icon = setupCameraToggle.querySelector('i');
        if (icon) {
            if (isCameraOn) {
                icon.className = 'fas fa-video';
                setupCameraToggle.classList.add('active');
            } else {
                icon.className = 'fas fa-video-slash';
                setupCameraToggle.classList.remove('active');
            }
        }
    }
}


// ============================================
// STEP 3: WAITING ROOM
// ============================================

function joinWaitingRoom() {
    // If host, skip waiting and go directly to meeting
    if (isHost) {
        enterMeeting();
        return;
    }

    // Stay on setup screen but switch to waiting state
    currentScreen = 'waiting';

    // Hide normal header, show waiting header
    const normalHeader = document.getElementById('setup-normal-header');
    const waitingHeader = document.getElementById('setup-waiting-header');
    const setupParticipantName = document.getElementById('setup-participant-name');

    if (normalHeader) normalHeader.style.display = 'none';
    if (waitingHeader) waitingHeader.style.display = 'block';
    if (setupParticipantName) setupParticipantName.textContent = userName;

    // Disable Join now button
    if (joinNowBtn) {
        joinNowBtn.disabled = true;
        joinNowBtn.textContent = 'Join now';
    }

    // Emit join request to server
    socket.emit('join-request', {
        name: userName,
        initials: userInitials,
        isHost: false,
        role: participantRole
    });
}

function startWaitingTimer() {
    let seconds = 0;
    const timerEl = document.getElementById('waiting-timer');

    setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }, 1000);
}

function admitParticipant() {
    // Host admits the participant
    socket.emit('admit-participant');

    // Hide notifications
    if (admissionNotification) admissionNotification.style.display = 'none';
    if (meetingAdmissionNotification) meetingAdmissionNotification.style.display = 'none';
}

function denyParticipant() {
    // Host denies the participant
    socket.emit('deny-participant');

    // Hide notifications
    if (admissionNotification) admissionNotification.style.display = 'none';
    if (meetingAdmissionNotification) meetingAdmissionNotification.style.display = 'none';
}

// ============================================
// STEP 4: MAIN MEETING
// ============================================

function enterMeeting() {
    // Prevent entering meeting multiple times
    if (hasEnteredMeeting) {
        console.log('Already entered meeting, skipping');
        return;
    }
    hasEnteredMeeting = true;

    currentScreen = 'meeting';
    splashScreen.style.display = 'none';
    setupScreen.style.display = 'none';
    waitingRoom.style.display = 'none';
    mainContainer.style.display = 'flex';

    // Set user name in top bar - REMOVED (element no longer exists)
    // currentUserName.textContent = userName;

    // Show video control panel if host or participant with videos
    if (isHost || isParticipantWithVideos) {
        const videoControlPanel = document.getElementById('host-video-control');
        if (videoControlPanel) {
            videoControlPanel.style.display = 'block';

            // Update header if participant
            if (isParticipantWithVideos && !isHost) {
                const header = videoControlPanel.querySelector('.video-control-header h4');
                if (header) header.textContent = 'Video Source Control';

                // Hide Slot 2 Control section (only for host)
                const slot2Section = videoControlPanel.querySelector('.video-control-section');
                if (slot2Section) slot2Section.style.display = 'none';

                // Hide links button and minimize button (only for host)
                const headerButtons = videoControlPanel.querySelector('.video-control-header > div');
                if (headerButtons) headerButtons.style.display = 'none';
            }
        }

        // Pre-create video elements (URLs will be set by loadVideosFromIndexedDB)
        if (isHost) {
            prepareHostVideoElements();
        } else if (isParticipantWithVideos) {
            prepareParticipantVideoElements();

            // Show Fred participant control panel if this is a Fred slot participant
            if (participantRole === 'fred') {
                // Hide the generic control panel for Fred slot participants
                const videoControlPanel = document.getElementById('host-video-control');
                if (videoControlPanel) videoControlPanel.style.display = 'none';

                // Show the Fred-specific control panel
                showFredParticipantControlPanel();
            }
        }
    }

    // Add local video
    addLocalVideo();

    // Add Sarah IA as virtual participant
    addSarahParticipant();

    // Add Sarah's initial message to chat
    addSarahInitialMessage();

    // Make Chat button active (underlined)
    activateChatButton();

    // Start meeting timer
    startMeetingTimer();

    // If host, send join-request to register on server FIRST
    if (isHost) {
        socket.emit('join-request', {
            name: userName,
            initials: userInitials,
            isHost: true
        });

        // Wait a bit for server to register, then send entered-meeting
        setTimeout(() => {
            socket.emit('entered-meeting');

            // Initialize virtual participants (P2, P3) after entering meeting
            setTimeout(() => {
                initVirtualParticipants();
                addP2ControlSection();

                // Add P2 to video grid if videos are available
                if (p2Video1Element || p2Video2Element) {
                    addVirtualParticipantDisplay('virtual-p2', p2Name || 'Participant 2', p2Initials || 'P2', p2VideoMode);
                }
            }, 500);
        }, 100);
    } else {
        // Participants just send entered-meeting immediately
        socket.emit('entered-meeting');
    }
}

function addSarahParticipant() {
    // Check if Slot 2 is already added
    if (document.getElementById('video-sarah')) {
        console.log('Slot 2 already added, skipping');
        return;
    }

    // Add Slot 2 based on current mode (Fred or Participant 3)
    if (slot2Mode === 'fred') {
        addFredParticipant();
    } else {
        addParticipant3Display();
    }
}

function addSarahInitialMessage() {
    // Don't add message if in participant3 mode
    if (slot2Mode === 'participant3') {
        console.log('In Participant 3 mode, skipping Fred message');
        return;
    }

    // Only add the message once
    if (sarahMessageAdded) {
        console.log('Fireflies message already added, skipping');
        return;
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    messageDiv.id = 'fred-welcome-message'; // Add ID for removal

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    messageDiv.innerHTML = `
        <div class="chat-message-avatar">F</div>
        <div class="chat-message-content">
            <div class="chat-message-header">
                <span class="chat-message-sender">Fred</span>
                <span class="chat-message-time">${timeStr}</span>
            </div>
            <div class="chat-message-text sarah">
                Hi everyone! I'm Fred, your AI assistant. I'm here to take notes and generate a summary for the host at the end of the meeting. Feel free to continue your meeting!
            </div>
        </div>
    `;

    meetingChatMessages.appendChild(messageDiv);
    sarahMessageAdded = true;
    console.log('Fireflies welcome message added');
}

function removeFredMessage() {
    const fredMessage = document.getElementById('fred-welcome-message');
    if (fredMessage) {
        fredMessage.remove();
        sarahMessageAdded = false;
        console.log('Fred welcome message removed');
    }
}

function activateChatButton() {
    // Find the Chat button in top bar and add underline to it
    const topButtons = document.querySelectorAll('.top-btn');
    topButtons.forEach(btn => {
        const text = btn.textContent.trim();
        if (text.includes('Chat')) {
            // Add active class or underline style
            const span = btn.querySelector('span');
            if (span && !span.classList.contains('chat-underline')) {
                span.classList.add('chat-underline');
            }
        }
    });
}

// Helper function to create name tag with mic icon
function createNameTag(name, micEnabled = true, isLocalUser = false, isHostUser = false) {
    const nameTag = document.createElement('div');
    nameTag.className = 'video-name-tag';

    // Add name with (Guest) for host only
    const nameSpan = document.createElement('span');
    if (isLocalUser && isHostUser) {
        // If it's the local user AND they are the host
        nameSpan.textContent = `${name} (Guest)`;
    } else {
        // All other participants (including local non-host) - just show name
        nameSpan.textContent = name;
    }
    nameTag.appendChild(nameSpan);

    // Add mic icon
    const micIcon = document.createElement('img');
    micIcon.src = micEnabled ? 'mic-on.svg' : 'mic-off.svg';
    micIcon.alt = micEnabled ? 'Mic on' : 'Mic off';
    micIcon.style.width = '14px';
    micIcon.style.height = '14px';
    nameTag.appendChild(micIcon);

    return nameTag;
}

// Helper function to update mic icon in name tag
function updateMicIcon(peerId, micEnabled) {
    const videoContainer = document.getElementById(`video-${peerId}`);
    if (!videoContainer) return;

    const nameTag = videoContainer.querySelector('.video-name-tag');
    if (!nameTag) return;

    const micIcon = nameTag.querySelector('img');
    if (micIcon) {
        micIcon.src = micEnabled ? 'mic-on.svg' : 'mic-off.svg';
        micIcon.alt = micEnabled ? 'Mic on' : 'Mic off';
    }
}

function addLocalVideo() {
    // Remove existing local video if it exists
    const existingLocal = document.getElementById(`video-${socket.id}`);
    if (existingLocal) {
        console.log('Removing existing local video');
        existingLocal.remove();
    }

    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    videoContainer.id = `video-${socket.id}`;

    // If host, check video mode
    if (isHost && hostVideoMode !== 'webcam') {
        if (hostVideoMode === 'stop') {
            // Show avatar with initials (same as camera off)
            const avatar = document.createElement('div');
            avatar.className = 'video-avatar';
            avatar.innerHTML = `
                <div class="video-avatar-circle">${userInitials}</div>
            `;
            videoContainer.appendChild(avatar);
        } else if (hostVideoMode === 'video1' && hostVideo1Element) {
            // Clone the video element to avoid moving it
            const videoClone = hostVideo1Element.cloneNode(true);
            videoClone.style.width = '100%';
            videoClone.style.height = '100%';
            videoClone.style.objectFit = 'cover';
            videoContainer.appendChild(videoClone);
            videoClone.play().catch(e => console.error('Error playing video 1:', e));
        } else if (hostVideoMode === 'video2' && hostVideo2Element) {
            // Clone the video element to avoid moving it
            const videoClone = hostVideo2Element.cloneNode(true);
            videoClone.style.width = '100%';
            videoClone.style.height = '100%';
            videoClone.style.objectFit = 'cover';
            videoContainer.appendChild(videoClone);
            videoClone.play().catch(e => console.error('Error playing video 2:', e));
        }
    } else if (isParticipantWithVideos && participantVideoMode !== 'webcam') {
        // Same logic for participant with videos
        if (participantVideoMode === 'stop') {
            // Show avatar with initials (same as camera off)
            const avatar = document.createElement('div');
            avatar.className = 'video-avatar';
            avatar.innerHTML = `
                <div class="video-avatar-circle">${userInitials}</div>
            `;
            videoContainer.appendChild(avatar);
        } else if (participantVideoMode === 'video1' && participantVideo1Element) {
            const videoClone = participantVideo1Element.cloneNode(true);
            videoClone.style.width = '100%';
            videoClone.style.height = '100%';
            videoClone.style.objectFit = 'cover';
            videoContainer.appendChild(videoClone);
            videoClone.play().catch(e => console.error('Error playing participant video 1:', e));
        } else if (participantVideoMode === 'video2' && participantVideo2Element) {
            const videoClone = participantVideo2Element.cloneNode(true);
            videoClone.style.width = '100%';
            videoClone.style.height = '100%';
            videoClone.style.objectFit = 'cover';
            videoContainer.appendChild(videoClone);
            videoClone.play().catch(e => console.error('Error playing participant video 2:', e));
        }
    } else if (isCameraOn && localStream) {
        const video = document.createElement('video');
        video.srcObject = localStream;
        video.autoplay = true;
        video.muted = true;
        videoContainer.appendChild(video);
    } else {
        // Show avatar with initials
        const avatar = document.createElement('div');
        avatar.className = 'video-avatar';
        avatar.innerHTML = `
            <div class="video-avatar-circle">${userInitials}</div>
        `;
        videoContainer.appendChild(avatar);
    }

    const nameTag = createNameTag(userName, isMicOn, true, isHost);
    videoContainer.appendChild(nameTag);

    videoGrid.appendChild(videoContainer);
}

function addRemoteVideo(peerId, peerName, peerInitials, stream) {
    const existing = document.getElementById(`video-${peerId}`);

    // If container already exists and has a video element with a stream, just update it
    if (existing && stream) {
        const existingVideo = existing.querySelector('video');
        if (existingVideo && existingVideo.srcObject) {
            // Stream already set, no need to recreate
            return;
        }
        // Container exists but has avatar (no stream yet) - replace with video
        existing.remove();
    } else if (existing && !stream) {
        // Already showing avatar, skip
        return;
    }

    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    videoContainer.id = `video-${peerId}`;

    if (stream) {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;
        videoContainer.appendChild(video);

        // Hidden audio element as fallback to ensure audio always plays
        const audio = document.createElement('audio');
        audio.srcObject = stream;
        audio.autoplay = true;
        videoContainer.appendChild(audio);
    } else {
        // Show avatar with initials
        const avatar = document.createElement('div');
        avatar.className = 'video-avatar';
        avatar.innerHTML = `
            <div class="video-avatar-circle">${peerInitials}</div>
        `;
        videoContainer.appendChild(avatar);
    }

    // For remote participants, assume mic is on by default (will be updated by events)
    const nameTag = createNameTag(peerName, true, false, false);
    videoContainer.appendChild(nameTag);

    videoGrid.appendChild(videoContainer);

    // Play after DOM insertion for reliability
    if (stream) {
        const video = videoContainer.querySelector('video');
        const audio = videoContainer.querySelector('audio');
        if (video) video.play().catch(e => console.log('Remote video play error:', e));
        if (audio) audio.play().catch(e => console.log('Remote audio play error:', e));
    }
}

function removeVideo(peerId) {
    const videoContainer = document.getElementById(`video-${peerId}`);
    if (videoContainer) {
        videoContainer.remove();
    }
}

function updateVideoDisplay(peerId, hasVideo) {
    const videoContainer = document.getElementById(`video-${peerId}`);
    if (!videoContainer) return;

    const participant = participants.get(peerId);
    if (!participant) return;

    // Clear existing content except name tag and audio element
    const nameTag = videoContainer.querySelector('.video-name-tag');
    const existingAudio = videoContainer.querySelector('audio');
    videoContainer.innerHTML = '';

    // Always keep audio element for continuous audio playback
    const stream = remoteStreams.get(peerId);
    if (stream) {
        const audio = existingAudio || document.createElement('audio');
        if (!existingAudio) {
            audio.srcObject = stream;
            audio.autoplay = true;
        }
        videoContainer.appendChild(audio);
    }

    // If hasVideo is false, ALWAYS show avatar regardless of stream
    if (hasVideo && stream) {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true; // Audio handled by separate audio element
        videoContainer.appendChild(video);
    } else {
        // Show avatar when camera is off OR in stop mode
        const avatar = document.createElement('div');
        avatar.className = 'video-avatar';
        avatar.innerHTML = `
            <div class="video-avatar-circle">${participant.initials}</div>
        `;
        videoContainer.appendChild(avatar);
    }

    videoContainer.appendChild(nameTag);
}

function startMeetingTimer() {
    // Clear any existing timer first
    if (timerInterval) {
        console.log('Clearing existing timer');
        clearInterval(timerInterval);
    }

    meetingStartTime = Date.now();
    let seconds = 0;

    timerInterval = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        meetingTimer.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }, 1000);
}

// ============================================
// CHAT FUNCTIONS
// ============================================

function sendChatMessage() {
    const text = meetingChatInput.value.trim();
    if (!text) return;

    socket.emit('chat-message', {
        sender: userName,
        text: text
    });

    meetingChatInput.value = '';
}

function displayChatMessage(data) {
    const messageDiv = document.createElement('div');

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const isSarah = data.sender === 'Sarah' || data.sender.includes('Sarah');
    const isOwnMessage = data.sender === userName;

    // Add 'own' class to message container if it's the user's own message
    if (isOwnMessage) {
        messageDiv.className = 'chat-message own';
    } else {
        messageDiv.className = 'chat-message';
    }

    let messageClass = '';
    if (isSarah) {
        messageClass = 'sarah';
    } else if (isOwnMessage) {
        messageClass = 'own-message';
    }

    // Get initials from sender name
    const initials = getInitials(data.sender);

    messageDiv.innerHTML = `
        <div class="chat-message-avatar">${initials}</div>
        <div class="chat-message-content">
            <div class="chat-message-header">
                <span class="chat-message-sender">${escapeHtml(data.sender)}</span>
                <span class="chat-message-time">${timeStr}</span>
            </div>
            <div class="chat-message-text ${messageClass}">
                ${escapeHtml(data.text)}
            </div>
        </div>
    `;

    meetingChatMessages.appendChild(messageDiv);
    meetingChatMessages.scrollTop = meetingChatMessages.scrollHeight;
}

// ============================================
// CAMERA/MIC CONTROLS
// ============================================

function toggleMainCamera() {
    if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            isCameraOn = videoTrack.enabled;

            // Update button icon and state
            const img = mainCameraBtn.querySelector('img');
            if (isCameraOn) {
                mainCameraBtn.classList.add('active');
                if (img) {
                    img.src = 'video-on.svg';
                    img.alt = 'Camera on';
                }
            } else {
                mainCameraBtn.classList.remove('active');
                if (img) {
                    img.src = 'video-off.svg';
                    img.alt = 'Camera off';
                }
            }

            // Update local video display
            updateLocalVideoDisplay();

            // Notify peers
            socket.emit('camera-toggle', { enabled: isCameraOn });
        }
    }
}

function toggleMainMic() {
    if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            isMicOn = audioTrack.enabled;

            // Update button icon and state
            const img = mainMicBtn.querySelector('img');
            if (isMicOn) {
                mainMicBtn.classList.add('active');
                if (img) {
                    img.src = 'mic-on.svg';
                    img.alt = 'Mic on';
                }
            } else {
                mainMicBtn.classList.remove('active');
                if (img) {
                    img.src = 'mic-off.svg';
                    img.alt = 'Mic off';
                }
            }

            // Update local mic icon
            updateMicIcon(socket.id, isMicOn);

            // Notify peers
            socket.emit('mic-toggle', { enabled: isMicOn });
        }
    }
}

function updateLocalVideoDisplay() {
    const localVideoContainer = document.getElementById(`video-${socket.id}`);
    if (!localVideoContainer) return;

    // Clear existing content except name tag
    const nameTag = localVideoContainer.querySelector('.video-name-tag');
    localVideoContainer.innerHTML = '';

    if (isCameraOn && localStream) {
        const video = document.createElement('video');
        video.srcObject = localStream;
        video.autoplay = true;
        video.muted = true;
        localVideoContainer.appendChild(video);
    } else {
        const avatar = document.createElement('div');
        avatar.className = 'video-avatar';
        avatar.innerHTML = `
            <div class="video-avatar-circle">${userInitials}</div>
        `;
        localVideoContainer.appendChild(avatar);
    }

    localVideoContainer.appendChild(nameTag);
}

// ============================================
// SOCKET EVENTS
// ============================================

function setupSocketEvents() {
    console.log('=== SETUP SOCKET EVENTS CALLED ===');

    socket.on('connect', () => {
        console.log('Connected to server:', socket.id);
    });

    socket.on('you-are-host', () => {
        isHost = true;
        console.log('You are the host');

        // Host enters meeting directly, no waiting!
        if (currentScreen === 'waiting') {
            enterMeeting();
        }
    });

    socket.on('waiting-for-admission', () => {
        // Participant is waiting for host to admit
        if (waitingMessage) waitingMessage.textContent = 'Waiting for host to let you in...';
    });

    socket.on('participant-waiting', (data) => {
        // Host sees notification that participant is waiting
        console.log('*** PARTICIPANT WAITING EVENT ***');
        console.log('isHost:', isHost);
        console.log('currentScreen:', currentScreen);
        console.log('participant name:', data.name);

        if (isHost) {
            if (currentScreen === 'waiting') {
                // Host in waiting room (old flow)
                console.log('Showing notification in waiting room');
                document.getElementById('waiting-guest-name').textContent = data.name;
                document.getElementById('waiting-guest-detail').textContent = `${data.name} (Guest)`;
                admissionNotification.style.display = 'block';
            } else if (currentScreen === 'meeting') {
                // Host in main meeting (new flow)
                console.log('Showing notification in meeting');

                // Find elements dynamically (in case they weren't found at load time)
                const notifEl = document.getElementById('meeting-admission-notification');
                const nameEl = document.getElementById('meeting-guest-name');

                if (nameEl && notifEl) {
                    nameEl.textContent = data.name;
                    notifEl.style.display = 'block';
                    console.log('Notification displayed for:', data.name);
                } else {
                    console.error('ERROR: Notification elements not found!');
                    // Fallback: show browser confirm dialog
                    if (confirm(`${data.name} veut rejoindre. Admettre?`)) {
                        socket.emit('admit-participant');
                    } else {
                        socket.emit('deny-participant');
                    }
                }
            }
        } else {
            console.log('ERROR: participant-waiting event received but isHost is false!');
        }
    });

    socket.on('admitted', () => {
        // Participant has been admitted
        enterMeeting();
    });

    socket.on('denied', () => {
        alert('The host has denied your request to join.');
        window.location.reload();
    });

    socket.on('existing-participants', (existingParticipants) => {
        // When entering meeting, get list of existing participants
        console.log('Existing participants:', existingParticipants);

        existingParticipants.forEach(participant => {
            participants.set(participant.id, participant);

            // Check if this participant has role=fred
            if (participant.role === 'fred') {
                console.log('Existing Fred slot participant:', participant.name);
                addFredSlotParticipant(participant.id, participant.name, participant.initials, null);
            } else {
                addRemoteVideo(participant.id, participant.name, participant.initials, null);
            }

            // Initiate WebRTC connection
            createPeerConnection(participant.id, true);
        });
    });

    socket.on('user-joined', (data) => {
        console.log('User joined:', data);
        participants.set(data.id, data);

        if (currentScreen === 'meeting') {
            // Check if this participant has role=fred
            if (data.role === 'fred') {
                console.log('Fred slot participant joined:', data.name);
                addFredSlotParticipant(data.id, data.name, data.initials, null);
            } else {
                addRemoteVideo(data.id, data.name, data.initials, null);
            }

            // Don't create peer connection here - wait for their offer
            // The new user will send us an offer, and we'll create the peer in the offer handler
            console.log(`⚪ Not creating peer for ${data.id} - waiting for their offer`);

            // If host, broadcast current state and create virtual peers for new participant
            if (isHost) {
                setTimeout(() => {
                    broadcastSlot2State();

                    // Re-emit virtual-participant-joined for each registered virtual participant
                    // so the new client knows about them (they missed the original broadcast)
                    for (const [virtualId, vp] of virtualPeers.entries()) {
                        socket.emit('register-virtual-participant', {
                            virtualId: virtualId,
                            name: vp.name,
                            initials: vp.initials
                        });
                    }

                    // Create virtual peer connections for the new participant
                    setTimeout(() => {
                        createVirtualPeersForNewParticipant(data.id);

                        // Send current video mode for each virtual participant
                        setTimeout(() => {
                            if (p2VideoMode !== 'stop') {
                                socket.emit('virtual-video-update', {
                                    virtualId: 'virtual-p2',
                                    videoMode: p2VideoMode
                                });
                            }
                        }, 1000);
                    }, 500);
                }, 500); // Small delay to ensure connection is ready
            }
        }
    });

    socket.on('user-left', (data) => {
        console.log('User left:', data.id);
        participants.delete(data.id);
        removeVideo(data.id);

        const peer = peers.get(data.id);
        if (peer) {
            peer.close();
            peers.delete(data.id);
        }

        remoteStreams.delete(data.id);
    });

    socket.on('chat-message', (data) => {
        displayChatMessage(data);
    });

    socket.on('camera-toggle', (data) => {
        console.log(`Camera toggle from ${data.from}: ${data.enabled ? 'ON' : 'OFF'}`);
        updateVideoDisplay(data.from, data.enabled);
    });

    socket.on('mic-toggle', (data) => {
        // Update mic icon on remote participant's video
        console.log(`${data.from} ${data.enabled ? 'unmuted' : 'muted'} mic`);
        updateMicIcon(data.from, data.enabled);
    });

    // Slot 2 state update (from host)
    socket.on('slot2-update', (data) => {
        console.log('Received slot2-update:', data);

        // Update local state
        slot2Mode = data.slot2Mode;
        participant3Name = data.participant3Name || '';
        participant3Initials = data.participant3Initials || 'P3';
        participant3VideoMode = data.participant3VideoMode || 'stop';

        // Refresh Slot 2 display based on new state
        refreshSlot2Display();
    });

    // Fred slot participant mode change (from real Fred slot participant)
    socket.on('fred-slot-mode-change', (data) => {
        console.log('Received fred-slot-mode-change:', data);

        // Update the Fred slot display for this participant
        const videoContainer = document.getElementById('video-sarah');
        if (videoContainer) {
            // Update name tag
            const nameTag = videoContainer.querySelector('.video-name-tag');
            if (nameTag) {
                const nameSpan = nameTag.querySelector('span');
                if (nameSpan) {
                    nameSpan.textContent = data.displayName;
                }
            }
        }

        // Handle Fred message based on mode
        if (data.mode === 'fred') {
            // Add Fred message if not present
            if (!sarahMessageAdded) {
                addSarahInitialMessage();
            }
        } else {
            // Remove Fred message when switching to participant mode
            removeFredMessage();
        }
    });

    // WebRTC signaling
    socket.on('offer', async (data) => {
        console.log('📥 Received offer from:', data.from);

        // Check if peer connection already exists
        let peer = peers.get(data.from);
        if (!peer) {
            console.log('   No existing peer - creating new peer connection to respond to offer');
            peer = await createPeerConnection(data.from, false);
        } else {
            console.log('   Peer already exists - using existing connection');
        }

        console.log('   Setting remote description (offer)');
        await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
        console.log('   Creating answer');
        const answer = await peer.createAnswer();
        console.log('   Setting local description (answer)');
        await peer.setLocalDescription(answer);
        console.log('📤 Sending answer to:', data.from);
        socket.emit('answer', { to: data.from, answer });
    });

    socket.on('answer', async (data) => {
        console.log('📥 Received answer from:', data.from);
        const peer = peers.get(data.from);
        if (peer) {
            await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
            console.log('✅ Answer processed for peer:', data.from);
        } else {
            console.error('❌ No peer connection found for answer from:', data.from);
        }
    });

    socket.on('ice-candidate', async (data) => {
        const peer = peers.get(data.from);
        if (peer && data.candidate) {
            await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    });
}

// ============================================
// WEBRTC FUNCTIONS
// ============================================

async function createPeerConnection(peerId, isInitiator) {
    console.log(`🔵 Creating peer connection with ${peerId}, isInitiator: ${isInitiator}`);
    console.log(`   localStream exists: ${!!localStream}, tracks:`, localStream ? localStream.getTracks().length : 0);

    // Check if RTCPeerConnection is supported
    if (typeof RTCPeerConnection === 'undefined') {
        console.error('❌ RTCPeerConnection is not supported in this browser!');
        console.error('Please use Chrome, Firefox, or Edge, and access via http://localhost:3000');
        alert('WebRTC is not supported in this browser. Please use Chrome, Firefox, or Edge.');
        return null;
    }

    const peer = new RTCPeerConnection(ICE_SERVERS);
    peers.set(peerId, peer);

    // Add local stream
    if (localStream) {
        const tracks = localStream.getTracks();
        console.log(`Adding ${tracks.length} local tracks to peer ${peerId}`);
        tracks.forEach(track => {
            peer.addTrack(track, localStream);
            console.log(`Added ${track.kind} track to peer ${peerId}`);
        });
    } else {
        console.warn(`⚠️ WARNING: No local stream available for peer ${peerId}! Adding transceivers to receive media.`);
        // Even without local media, we need transceivers so the SDP offer
        // includes audio/video sections and the remote peer sends us their tracks
        peer.addTransceiver('audio', { direction: 'recvonly' });
        peer.addTransceiver('video', { direction: 'recvonly' });
    }

    // Handle remote stream
    peer.ontrack = (event) => {
        console.log('Received track from', peerId, 'kind:', event.track.kind);
        const [stream] = event.streams;
        remoteStreams.set(peerId, stream);

        const participant = participants.get(peerId);
        if (participant) {
            console.log(`Updating video display for ${participant.name} with stream`);
            // Check if this participant has role=fred
            if (participant.role === 'fred') {
                updateFredSlotParticipantVideo(peerId, stream);
            } else {
                addRemoteVideo(peerId, participant.name, participant.initials, stream);
            }
        }
    };

    // Handle ICE candidates
    peer.onicecandidate = (event) => {
        if (event.candidate) {
            // Reduced logging for ICE candidates (they are frequent)
            socket.emit('ice-candidate', {
                to: peerId,
                candidate: event.candidate
            });
        }
    };

    // Monitor connection state
    peer.onconnectionstatechange = () => {
        // Only log important state changes
        if (peer.connectionState === 'connected' || peer.connectionState === 'failed' || peer.connectionState === 'disconnected') {
            console.log(`Peer ${peerId} connection state:`, peer.connectionState);
        }
    };

    peer.oniceconnectionstatechange = () => {
        // Only log important state changes
        if (peer.iceConnectionState === 'connected' || peer.iceConnectionState === 'failed' || peer.iceConnectionState === 'disconnected') {
            console.log(`Peer ${peerId} ICE connection state:`, peer.iceConnectionState);
        }
    };

    // Create offer if initiator
    if (isInitiator) {
        console.log(`🟢 Creating offer for peer ${peerId}`);
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        console.log(`📤 Sending offer to peer ${peerId}`);
        socket.emit('offer', { to: peerId, offer });
    } else {
        console.log(`⚪ Not initiator - waiting for offer from ${peerId}`);
    }

    return peer;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getInitials(name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// HOST VIDEO CONTROL
// ============================================

function loadVideosFromIndexedDB(userType) {
    console.log('Loading videos from IndexedDB for:', userType);

    // Open without version to get latest version
    const request = indexedDB.open('TeamsCloneDB');

    request.onsuccess = (event) => {
        const db = event.target.result;
        console.log('IndexedDB opened, version:', db.version, 'stores:', Array.from(db.objectStoreNames));

        if (!db.objectStoreNames.contains('videos')) {
            console.log('No videos store found in IndexedDB');
            db.close();
            return;
        }

        const transaction = db.transaction(['videos'], 'readonly');
        const store = transaction.objectStore('videos');

        if (userType === 'host') {
            // Load host videos (IDs 1 and 2)
            const getVideo1 = store.get(1);
            getVideo1.onsuccess = () => {
                if (getVideo1.result && getVideo1.result.file) {
                    hostVideo1URL = URL.createObjectURL(getVideo1.result.file);
                    console.log('Host Video 1 loaded from IndexedDB, URL:', hostVideo1URL);

                    hostVideo1Element = document.createElement('video');
                    hostVideo1Element.src = hostVideo1URL;
                    hostVideo1Element.loop = true;
                    hostVideo1Element.muted = true;
                    hostVideo1Element.playsInline = true;
                    hostVideo1Element.preload = 'auto';
                    console.log('Host Video 1 element created');
                } else {
                    console.log('No host video 1 found in IndexedDB');
                }
            };

            const getVideo2 = store.get(2);
            getVideo2.onsuccess = () => {
                if (getVideo2.result && getVideo2.result.file) {
                    hostVideo2URL = URL.createObjectURL(getVideo2.result.file);
                    console.log('Host Video 2 loaded from IndexedDB, URL:', hostVideo2URL);

                    hostVideo2Element = document.createElement('video');
                    hostVideo2Element.src = hostVideo2URL;
                    hostVideo2Element.loop = true;
                    hostVideo2Element.muted = true;
                    hostVideo2Element.playsInline = true;
                    hostVideo2Element.preload = 'auto';
                    console.log('Host Video 2 element created');
                } else {
                    console.log('No host video 2 found in IndexedDB');
                }
            };

            // Load Participant 2 videos (IDs 3 and 4) - uploaded by host
            const getP2Video1 = store.get(3);
            getP2Video1.onsuccess = () => {
                if (getP2Video1.result && getP2Video1.result.file) {
                    p2Video1URL = URL.createObjectURL(getP2Video1.result.file);
                    console.log('P2 Video 1 loaded from IndexedDB, URL:', p2Video1URL);

                    p2Video1Element = document.createElement('video');
                    p2Video1Element.src = p2Video1URL;
                    p2Video1Element.loop = true;
                    p2Video1Element.muted = true;
                    p2Video1Element.playsInline = true;
                    p2Video1Element.preload = 'auto';
                    console.log('P2 Video 1 element created');
                } else {
                    console.log('No P2 video 1 found in IndexedDB (ID 3)');
                }
            };

            const getP2Video2 = store.get(4);
            getP2Video2.onsuccess = () => {
                if (getP2Video2.result && getP2Video2.result.file) {
                    p2Video2URL = URL.createObjectURL(getP2Video2.result.file);
                    console.log('P2 Video 2 loaded from IndexedDB, URL:', p2Video2URL);

                    p2Video2Element = document.createElement('video');
                    p2Video2Element.src = p2Video2URL;
                    p2Video2Element.loop = true;
                    p2Video2Element.muted = true;
                    p2Video2Element.playsInline = true;
                    p2Video2Element.preload = 'auto';
                    console.log('P2 Video 2 element created');
                } else {
                    console.log('No P2 video 2 found in IndexedDB (ID 4)');
                }
            };

            // Load Participant 3 videos (IDs 5 and 6) - uploaded by host
            const getP3Video1 = store.get(5);
            getP3Video1.onsuccess = () => {
                if (getP3Video1.result && getP3Video1.result.file) {
                    p3Video1URL = URL.createObjectURL(getP3Video1.result.file);
                    console.log('P3 Video 1 loaded from IndexedDB, URL:', p3Video1URL);

                    p3Video1Element = document.createElement('video');
                    p3Video1Element.src = p3Video1URL;
                    p3Video1Element.loop = true;
                    p3Video1Element.muted = true;
                    p3Video1Element.playsInline = true;
                    p3Video1Element.preload = 'auto';
                    console.log('P3 Video 1 element created');
                } else {
                    console.log('No P3 video 1 found in IndexedDB (ID 5)');
                }
            };

            const getP3Video2 = store.get(6);
            getP3Video2.onsuccess = () => {
                if (getP3Video2.result && getP3Video2.result.file) {
                    p3Video2URL = URL.createObjectURL(getP3Video2.result.file);
                    console.log('P3 Video 2 loaded from IndexedDB, URL:', p3Video2URL);

                    p3Video2Element = document.createElement('video');
                    p3Video2Element.src = p3Video2URL;
                    p3Video2Element.loop = true;
                    p3Video2Element.muted = true;
                    p3Video2Element.playsInline = true;
                    p3Video2Element.preload = 'auto';
                    console.log('P3 Video 2 element created');
                } else {
                    console.log('No P3 video 2 found in IndexedDB (ID 6)');
                }
            };
        } else if (userType === 'participant') {
            // Load participant videos (IDs 3 and 4)
            const getVideo3 = store.get(3);
            getVideo3.onsuccess = () => {
                console.log('getVideo3 result:', getVideo3.result);
                if (getVideo3.result && getVideo3.result.file) {
                    participantVideo1URL = URL.createObjectURL(getVideo3.result.file);
                    console.log('Participant Video 1 loaded from IndexedDB, URL:', participantVideo1URL);

                    participantVideo1Element = document.createElement('video');
                    participantVideo1Element.src = participantVideo1URL;
                    participantVideo1Element.loop = true;
                    participantVideo1Element.muted = true;
                    participantVideo1Element.playsInline = true;
                    participantVideo1Element.preload = 'auto';
                    console.log('Participant Video 1 element created');
                } else {
                    console.log('No participant video 1 found in IndexedDB (ID 3)');
                }
            };

            const getVideo4 = store.get(4);
            getVideo4.onsuccess = () => {
                console.log('getVideo4 result:', getVideo4.result);
                if (getVideo4.result && getVideo4.result.file) {
                    participantVideo2URL = URL.createObjectURL(getVideo4.result.file);
                    console.log('Participant Video 2 loaded from IndexedDB, URL:', participantVideo2URL);

                    participantVideo2Element = document.createElement('video');
                    participantVideo2Element.src = participantVideo2URL;
                    participantVideo2Element.loop = true;
                    participantVideo2Element.muted = true;
                    participantVideo2Element.playsInline = true;
                    participantVideo2Element.preload = 'auto';
                    console.log('Participant Video 2 element created');
                } else {
                    console.log('No participant video 2 found in IndexedDB (ID 4)');
                }
            };
        }

        transaction.oncomplete = () => {
            db.close();
            console.log('IndexedDB transaction complete, db closed');
        };
    };

    request.onerror = (error) => {
        console.error('Error opening IndexedDB:', error);
    };
}

function prepareHostVideoElements() {
    // Create video elements if URLs are already available
    if (hostVideo1URL && !hostVideo1Element) {
        hostVideo1Element = document.createElement('video');
        hostVideo1Element.src = hostVideo1URL;
        hostVideo1Element.loop = true;
        hostVideo1Element.muted = true;
        hostVideo1Element.playsInline = true;
    }

    if (hostVideo2URL && !hostVideo2Element) {
        hostVideo2Element = document.createElement('video');
        hostVideo2Element.src = hostVideo2URL;
        hostVideo2Element.loop = true;
        hostVideo2Element.muted = true;
        hostVideo2Element.playsInline = true;
    }
}

function prepareParticipantVideoElements() {
    // Create video elements if URLs are already available
    if (participantVideo1URL && !participantVideo1Element) {
        participantVideo1Element = document.createElement('video');
        participantVideo1Element.src = participantVideo1URL;
        participantVideo1Element.loop = true;
        participantVideo1Element.muted = true;
        participantVideo1Element.playsInline = true;
    }

    if (participantVideo2URL && !participantVideo2Element) {
        participantVideo2Element = document.createElement('video');
        participantVideo2Element.src = participantVideo2URL;
        participantVideo2Element.loop = true;
        participantVideo2Element.muted = true;
        participantVideo2Element.playsInline = true;
    }
}

async function switchHostVideo(mode) {
    // Support both host and participant with videos
    if (!isHost && !isParticipantWithVideos) return;

    console.log('=== switchHostVideo called ===');
    console.log('Mode:', mode);
    console.log('isHost:', isHost);
    console.log('isParticipantWithVideos:', isParticipantWithVideos);
    console.log('participantVideo1Element:', participantVideo1Element);
    console.log('participantVideo2Element:', participantVideo2Element);
    console.log('participantVideo1URL:', participantVideo1URL);
    console.log('participantVideo2URL:', participantVideo2URL);

    // Update mode based on user type
    if (isHost) {
        hostVideoMode = mode;
    } else if (isParticipantWithVideos) {
        participantVideoMode = mode;
    }

    // Update button states
    const buttons = document.querySelectorAll('.video-control-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    const activeBtn = document.getElementById(`btn-${mode}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    // Get the new video stream based on mode
    let newVideoTrack = null;

    if (mode === 'webcam') {
        // Switch back to webcam
        if (localStream) {
            const videoTracks = localStream.getVideoTracks();
            if (videoTracks.length > 0) {
                newVideoTrack = videoTracks[0];
                console.log('Using webcam track');
            }
        }
    } else if (mode === 'video1') {
        // Get video track from video1 element
        const videoElement = isHost ? hostVideo1Element : participantVideo1Element;
        console.log('Video1 element:', videoElement);
        console.log('Video1 src:', videoElement ? videoElement.src : 'N/A');
        console.log('Video1 readyState:', videoElement ? videoElement.readyState : 'N/A');

        if (!videoElement) {
            console.error('Video 1 element not found! Videos may not be loaded yet.');
            alert('Vidéo 1 non chargée. Veuillez patienter ou recharger la page.');
            return;
        }

        if (!videoElement.src) {
            console.error('Video 1 has no source!');
            alert('Vidéo 1 non configurée (pas de source).');
            return;
        }

        try {
            // Wait for video to be ready if not already
            if (videoElement.readyState < 2) {
                console.log('Waiting for video1 to load metadata...');
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error('Video load timeout')), 10000);
                    videoElement.onloadeddata = () => {
                        clearTimeout(timeout);
                        resolve();
                    };
                    videoElement.onerror = () => {
                        clearTimeout(timeout);
                        reject(new Error('Video load error'));
                    };
                    videoElement.load();
                });
            }

            console.log('Attempting to play video1...');
            await videoElement.play();
            console.log('Video1 playing, getting stream...');

            const stream = videoElement.captureStream ? videoElement.captureStream() : videoElement.mozCaptureStream();
            console.log('Captured stream:', stream);

            if (stream) {
                const tracks = stream.getVideoTracks();
                console.log('Video tracks from stream:', tracks.length);
                if (tracks.length > 0) {
                    newVideoTrack = tracks[0];
                    console.log('Got video track from video1');
                } else {
                    console.error('No video tracks in captured stream!');
                    alert('Erreur: pas de piste vidéo dans le stream capturé.');
                    return;
                }
            } else {
                console.error('Failed to capture stream from video element!');
                alert('Erreur: impossible de capturer le stream vidéo.');
                return;
            }
        } catch (error) {
            console.error('Error playing video1:', error);
            alert('Erreur lecture vidéo 1: ' + error.message);
            return;
        }
    } else if (mode === 'video2') {
        // Get video track from video2 element
        const videoElement = isHost ? hostVideo2Element : participantVideo2Element;
        console.log('Video2 element:', videoElement);
        console.log('Video2 src:', videoElement ? videoElement.src : 'N/A');
        console.log('Video2 readyState:', videoElement ? videoElement.readyState : 'N/A');

        if (!videoElement) {
            console.error('Video 2 element not found! Videos may not be loaded yet.');
            alert('Vidéo 2 non chargée. Veuillez patienter ou recharger la page.');
            return;
        }

        if (!videoElement.src) {
            console.error('Video 2 has no source!');
            alert('Vidéo 2 non configurée (pas de source).');
            return;
        }

        try {
            // Wait for video to be ready if not already
            if (videoElement.readyState < 2) {
                console.log('Waiting for video2 to load metadata...');
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error('Video load timeout')), 10000);
                    videoElement.onloadeddata = () => {
                        clearTimeout(timeout);
                        resolve();
                    };
                    videoElement.onerror = () => {
                        clearTimeout(timeout);
                        reject(new Error('Video load error'));
                    };
                    videoElement.load();
                });
            }

            console.log('Attempting to play video2...');
            await videoElement.play();
            console.log('Video2 playing, getting stream...');

            const stream = videoElement.captureStream ? videoElement.captureStream() : videoElement.mozCaptureStream();
            console.log('Captured stream:', stream);

            if (stream) {
                const tracks = stream.getVideoTracks();
                console.log('Video tracks from stream:', tracks.length);
                if (tracks.length > 0) {
                    newVideoTrack = tracks[0];
                    console.log('Got video track from video2');
                } else {
                    console.error('No video tracks in captured stream!');
                    alert('Erreur: pas de piste vidéo dans le stream capturé.');
                    return;
                }
            } else {
                console.error('Failed to capture stream from video element!');
                alert('Erreur: impossible de capturer le stream vidéo.');
                return;
            }
        } catch (error) {
            console.error('Error playing video2:', error);
            alert('Erreur lecture vidéo 2: ' + error.message);
            return;
        }
    } else if (mode === 'stop') {
        // Create a transparent/empty canvas stream to keep connection alive
        // This prevents the video from freezing on remote peers
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');

        // Fill with transparent/gray color to indicate "no video"
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Create a low FPS stream (just to keep connection alive)
        const emptyStream = canvas.captureStream(1);
        newVideoTrack = emptyStream.getVideoTracks()[0];
        console.log('Created black canvas track for stop mode');
    }

    // Replace video track in all peer connections
    for (const [peerId, peer] of peers.entries()) {
        const senders = peer.getSenders();
        const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');

        if (videoSender) {
            try {
                await videoSender.replaceTrack(newVideoTrack);
                console.log(`✅ Replaced video track for peer ${peerId} with ${mode}`);
            } catch (error) {
                console.error(`❌ Error replacing track for peer ${peerId}:`, error);
            }
        }
    }

    // Notify others about video state change
    socket.emit('camera-toggle', { enabled: mode !== 'stop' });

    // Refresh local video display
    const existingContainer = document.getElementById(`video-${socket.id}`);
    if (existingContainer) {
        existingContainer.remove();
    }

    addLocalVideo();
}

// ============================================
// SLOT 2 CONTROL (FRED / PARTICIPANT 3)
// ============================================

// Broadcast Slot 2 state to all participants
function broadcastSlot2State() {
    if (!isHost) return;

    const slot2State = {
        slot2Mode: slot2Mode,
        participant3Name: participant3Name,
        participant3Initials: participant3Initials,
        participant3VideoMode: participant3VideoMode
    };

    console.log('Broadcasting slot2 state:', slot2State);
    socket.emit('slot2-update', slot2State);
}

function switchSlot2Mode(mode) {
    if (!isHost) return;

    console.log('Switching Slot 2 mode to:', mode);
    slot2Mode = mode;

    // Update mode buttons
    const btnFred = document.getElementById('btn-mode-fred');
    const btnP3 = document.getElementById('btn-mode-participant3');

    if (btnFred) btnFred.classList.toggle('active', mode === 'fred');
    if (btnP3) btnP3.classList.toggle('active', mode === 'participant3');

    // Show/hide Participant 3 controls
    const nameInput = document.getElementById('participant3-name-input');
    const videoControls = document.getElementById('participant3-video-controls');

    if (nameInput) nameInput.style.display = mode === 'participant3' ? 'block' : 'none';
    if (videoControls) videoControls.style.display = mode === 'participant3' ? 'flex' : 'none';

    // Refresh Slot 2 display
    refreshSlot2Display();

    // Broadcast to all participants
    broadcastSlot2State();
}

function updateParticipant3Name() {
    const input = document.getElementById('participant3-name');
    if (input) {
        participant3Name = input.value.trim();
        participant3Initials = getInitials(participant3Name || 'P3');
        console.log('Updated Participant 3 name:', participant3Name, 'initials:', participant3Initials);

        // Refresh display if in participant3 mode
        if (slot2Mode === 'participant3') {
            refreshSlot2Display();
        }

        // Broadcast to all participants (debounced effect via normal typing)
        broadcastSlot2State();
    }
}

function switchParticipant3Video(mode) {
    if (!isHost) return;

    console.log('Switching Participant 3 video to:', mode);
    participant3VideoMode = mode;

    // Update button states
    const buttons = document.querySelectorAll('#participant3-video-controls .video-control-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    const activeBtn = document.getElementById(`btn-p3-${mode}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    // Refresh Slot 2 display
    refreshSlot2Display();

    // Broadcast to all participants
    broadcastSlot2State();
}

function triggerP3VideoUpload(slot) {
    // If video already uploaded, switch to it directly
    if (slot === 1 && p3Video1Element) {
        switchParticipant3Video('video1');
        return;
    }
    if (slot === 2 && p3Video2Element) {
        switchParticipant3Video('video2');
        return;
    }

    // Otherwise, trigger file upload
    const input = document.getElementById(`p3-video-input-${slot}`);
    if (input) {
        input.click();
    }
}

function handleP3VideoUpload(slot, input) {
    const file = input.files[0];
    if (!file) return;

    console.log(`Uploading Participant 3 Video ${slot}:`, file.name);

    // Create video URL
    const videoURL = URL.createObjectURL(file);

    // Create video element
    const videoElement = document.createElement('video');
    videoElement.src = videoURL;
    videoElement.loop = true;
    videoElement.muted = true;
    videoElement.playsInline = true;

    if (slot === 1) {
        // Revoke old URL if exists
        if (p3Video1URL) {
            URL.revokeObjectURL(p3Video1URL);
        }
        p3Video1URL = videoURL;
        p3Video1Element = videoElement;
    } else {
        if (p3Video2URL) {
            URL.revokeObjectURL(p3Video2URL);
        }
        p3Video2URL = videoURL;
        p3Video2Element = videoElement;
    }

    // Update button text to show video is loaded
    const btn = document.getElementById(`btn-p3-video${slot}`);
    if (btn) {
        const span = btn.querySelector('span');
        if (span) {
            span.textContent = `Video ${slot} ✓`;
        }
    }

    // Switch to this video
    switchParticipant3Video(`video${slot}`);
}

function refreshSlot2Display() {
    // Remove existing Slot 2 element
    const existingSlot2 = document.getElementById('video-sarah');
    if (existingSlot2) {
        existingSlot2.remove();
    }

    // Re-add based on current mode
    if (slot2Mode === 'fred') {
        addFredParticipant();
        // Re-add Fred's message if not already present
        if (!sarahMessageAdded) {
            addSarahInitialMessage();
        }
    } else {
        addParticipant3Display();
        // In participant3 mode, remove Fred's message
        removeFredMessage();
    }
}

function addFredParticipant() {
    // Check if already added
    if (document.getElementById('video-sarah')) {
        return;
    }

    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    videoContainer.id = 'video-sarah';

    const avatar = document.createElement('div');
    avatar.className = 'video-avatar video-avatar-fireflies';
    avatar.innerHTML = `
        <img src="fireflies-logo.svg" alt="Fireflies.ai" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">
        <div class="video-avatar-name" style="color: #5b2c6f;">Fred</div>
        <div class="video-avatar-role" style="color: #5b2c6f;">Fireflies.ai Notetaker</div>
    `;
    videoContainer.appendChild(avatar);

    const nameTag = createNameTag('Fred', false, false, false);
    videoContainer.appendChild(nameTag);

    videoGrid.appendChild(videoContainer);
}

// Add a real participant in the Fred slot (pink background)
function addFredSlotParticipant(peerId, peerName, peerInitials, stream) {
    // Remove existing Fred/Slot2 display
    const existingFred = document.getElementById('video-sarah');
    if (existingFred) existingFred.remove();

    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    videoContainer.id = 'video-sarah'; // Use Fred slot ID
    videoContainer.dataset.peerId = peerId; // Store peer ID for stream updates

    if (stream) {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;
        videoContainer.appendChild(video);
        // Force play (in case autoplay is blocked)
        video.play().catch(e => console.log('Fred slot video play error:', e));
    } else {
        // Show avatar with pink background (Fireflies style)
        const avatar = document.createElement('div');
        avatar.className = 'video-avatar video-avatar-fireflies';
        avatar.innerHTML = `
            <div class="video-avatar-circle" style="background: #5b2c6f; color: white;">${peerInitials}</div>
        `;
        videoContainer.appendChild(avatar);
    }

    const nameTag = createNameTag(peerName, true, false, false);
    videoContainer.appendChild(nameTag);

    videoGrid.appendChild(videoContainer);

    // Add Fred welcome message
    addSarahInitialMessage();

    console.log('Added Fred slot participant:', peerName, 'with stream:', !!stream);
}

// Update Fred slot participant video when stream changes
function updateFredSlotParticipantVideo(peerId, stream) {
    const videoContainer = document.getElementById('video-sarah');
    if (!videoContainer || videoContainer.dataset.peerId !== peerId) return;

    const participant = participants.get(peerId);
    if (!participant) return;

    console.log('Updating Fred slot participant video, has stream:', !!stream);

    // Clear existing content except name tag
    const nameTag = videoContainer.querySelector('.video-name-tag');
    videoContainer.innerHTML = '';

    if (stream) {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;
        video.muted = false;
        videoContainer.appendChild(video);
        // Force play (in case autoplay is blocked)
        video.play().catch(e => console.log('Fred slot video play error:', e));
    } else {
        // Show avatar with pink background
        const avatar = document.createElement('div');
        avatar.className = 'video-avatar video-avatar-fireflies';
        avatar.innerHTML = `
            <div class="video-avatar-circle" style="background: #5b2c6f; color: white;">${participant.initials}</div>
        `;
        videoContainer.appendChild(avatar);
    }

    if (nameTag) videoContainer.appendChild(nameTag);
    videoContainer.dataset.peerId = peerId;
}

function addParticipant3Display() {
    // Check if already added
    if (document.getElementById('video-sarah')) {
        return;
    }

    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    videoContainer.id = 'video-sarah'; // Keep same ID for slot 2

    const displayName = participant3Name || 'Participant 3';
    const displayInitials = participant3Initials || 'P3';

    if (participant3VideoMode === 'stop') {
        // Show avatar with initials
        const avatar = document.createElement('div');
        avatar.className = 'video-avatar';
        avatar.innerHTML = `
            <div class="video-avatar-circle">${displayInitials}</div>
        `;
        videoContainer.appendChild(avatar);
    } else if (participant3VideoMode === 'video1' && p3Video1Element) {
        // Show Participant 3's video 1 (host has the video)
        const videoClone = p3Video1Element.cloneNode(true);
        videoClone.style.width = '100%';
        videoClone.style.height = '100%';
        videoClone.style.objectFit = 'cover';
        videoContainer.appendChild(videoClone);
        videoClone.play().catch(e => console.error('Error playing P3 video 1:', e));
    } else if (participant3VideoMode === 'video2' && p3Video2Element) {
        // Show Participant 3's video 2 (host has the video)
        const videoClone = p3Video2Element.cloneNode(true);
        videoClone.style.width = '100%';
        videoClone.style.height = '100%';
        videoClone.style.objectFit = 'cover';
        videoContainer.appendChild(videoClone);
        videoClone.play().catch(e => console.error('Error playing P3 video 2:', e));
    } else if ((participant3VideoMode === 'video1' || participant3VideoMode === 'video2') && !isHost) {
        // Non-host participant: video is playing but we don't have the file
        // Show a "video playing" indicator instead of just avatar
        const videoIndicator = document.createElement('div');
        videoIndicator.className = 'video-avatar';
        videoIndicator.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
        videoIndicator.innerHTML = `
            <div class="video-avatar-circle" style="background: linear-gradient(135deg, #6264a7 0%, #464775 100%); position: relative;">
                ${displayInitials}
                <div style="position: absolute; bottom: -5px; right: -5px; width: 20px; height: 20px; background: #107c10; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                </div>
            </div>
            <div style="color: #a0a0a0; font-size: 12px; margin-top: 8px;">Camera active</div>
        `;
        videoContainer.appendChild(videoIndicator);
    } else {
        // Default to avatar (no video uploaded yet or host without video loaded)
        const avatar = document.createElement('div');
        avatar.className = 'video-avatar';
        avatar.innerHTML = `
            <div class="video-avatar-circle">${displayInitials}</div>
        `;
        videoContainer.appendChild(avatar);
    }

    const nameTag = createNameTag(displayName, false, false, false);
    videoContainer.appendChild(nameTag);

    videoGrid.appendChild(videoContainer);
}

// ============================================
// CONTROL PANEL FUNCTIONS
// ============================================

let controlPanelMinimized = false;

function toggleControlPanel() {
    const content = document.getElementById('control-panel-content');
    const btn = document.getElementById('btn-minimize-panel');
    const linksPopup = document.getElementById('participant-links-popup');

    if (controlPanelMinimized) {
        // Expand
        content.style.display = 'block';
        btn.textContent = '−';
        btn.title = 'Réduire';
        controlPanelMinimized = false;
    } else {
        // Minimize
        content.style.display = 'none';
        if (linksPopup) linksPopup.style.display = 'none';
        btn.textContent = '+';
        btn.title = 'Agrandir';
        controlPanelMinimized = true;
    }
}

function showParticipantLinks() {
    const popup = document.getElementById('participant-links-popup');
    const link1Input = document.getElementById('link-participant1');
    const link2Input = document.getElementById('link-participant2');
    const link3Input = document.getElementById('link-participant3');
    const label1 = document.getElementById('label-participant1');
    const label2 = document.getElementById('label-participant2');
    const label3 = document.getElementById('label-participant3');

    if (popup.style.display === 'none') {
        // Retrieve stored links from sessionStorage
        const storedLink1 = sessionStorage.getItem('participantLink1');
        const storedLink2 = sessionStorage.getItem('participantLink2');
        const storedLink3 = sessionStorage.getItem('participantLink3');
        const storedName1 = sessionStorage.getItem('participantName1');
        const storedName2 = sessionStorage.getItem('participantName2');
        const storedName3 = sessionStorage.getItem('participantName3');

        // Use stored links or show message if not configured
        if (storedLink1) {
            link1Input.value = storedLink1;
            if (label1) label1.textContent = storedName1 || 'Participant 1';
        } else {
            link1Input.value = 'Lien non configuré - retournez à host-setup';
            if (label1) label1.textContent = 'Participant 1 (non configuré)';
        }

        if (storedLink2) {
            link2Input.value = storedLink2;
            if (label2) label2.textContent = storedName2 || 'Participant 2';
        } else {
            link2Input.value = 'Lien non configuré - retournez à host-setup';
            if (label2) label2.textContent = 'Participant 2 (non configuré)';
        }

        if (link3Input) {
            if (storedLink3) {
                link3Input.value = storedLink3;
                if (label3) label3.textContent = storedName3 || 'Participant 3';
            } else {
                link3Input.value = 'Lien non configuré - retournez à host-setup';
                if (label3) label3.textContent = 'Participant 3 (non configuré)';
            }
        }

        popup.style.display = 'block';
    } else {
        popup.style.display = 'none';
    }
}

function copyLink(participantNum) {
    const input = document.getElementById(`link-participant${participantNum}`);
    if (input) {
        input.select();
        document.execCommand('copy');

        // Visual feedback
        const btn = input.nextElementSibling;
        const originalText = btn.textContent;
        btn.textContent = 'Copié!';
        btn.style.background = '#107c10';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '#6264a7';
        }, 1500);
    }
}

// TEST FUNCTION - Force show admission notification
function testShowNotification() {
    console.log('=== TEST BUTTON CLICKED ===');
    console.log('meetingAdmissionNotification:', meetingAdmissionNotification);
    console.log('meetingGuestName:', meetingGuestName);

    if (meetingAdmissionNotification && meetingGuestName) {
        meetingGuestName.textContent = 'TEST PARTICIPANT';
        meetingAdmissionNotification.style.display = 'block';
        console.log('✅ Notification set to display: block');
        console.log('Current display style:', meetingAdmissionNotification.style.display);
        console.log('Element position:', meetingAdmissionNotification.getBoundingClientRect());
    } else {
        console.error('❌ Elements not found!');
        console.error('meetingAdmissionNotification:', meetingAdmissionNotification);
        console.error('meetingGuestName:', meetingGuestName);
    }
}

// Leave meeting function
function leaveMeeting() {
    console.log('Leaving meeting...');

    // Stop all local media tracks (webcam, microphone)
    if (localStream) {
        localStream.getTracks().forEach(track => {
            track.stop();
            console.log(`Stopped ${track.kind} track`);
        });
        localStream = null;
    }

    // Close all peer connections
    peers.forEach((peer, peerId) => {
        peer.close();
        console.log(`Closed peer connection with ${peerId}`);
    });
    peers.clear();
    remoteStreams.clear();
    participants.clear();

    // Clear timer
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    // Disconnect socket
    if (socket && socket.connected) {
        socket.disconnect();
        console.log('Disconnected from server');
    }

    // Clear session storage
    sessionStorage.removeItem('isHost');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('isParticipantWithVideos');

    // Redirect to Teams page
    window.location.href = 'https://teams.live.com/free';
}

// Toggle chat panel visibility
function toggleChat() {
    const chatPanel = document.getElementById('meeting-chat-panel');

    if (!chatPanel) return;

    // Toggle visibility
    if (chatPanel.style.display === 'none') {
        // Show chat
        chatPanel.style.display = 'flex';
        console.log('Chat panel opened');
    } else {
        // Hide chat
        chatPanel.style.display = 'none';
        console.log('Chat panel closed');
    }
}

// Update meeting date and time based on system date/time
function updateMeetingDateTime() {
    console.log('updateMeetingDateTime called');
    const now = new Date();

    // Format day of week
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = daysOfWeek[now.getDay()];

    // Format month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[now.getMonth()];

    // Get day of month
    const day = now.getDate();

    // Calculate start time (current time)
    const startHour = now.getHours();
    const startMinute = now.getMinutes();

    // Calculate end time (1 hour later)
    const endTime = new Date(now.getTime() + 60 * 60 * 1000); // Add 1 hour
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();

    // Format times (12-hour format with AM/PM)
    const formatTime = (hour, minute) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        const minuteStr = minute.toString().padStart(2, '0');
        return `${hour12}:${minuteStr} ${period}`;
    };

    // Get timezone offset
    const offsetMinutes = -now.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetSign = offsetMinutes >= 0 ? '+' : '-';
    const timezoneStr = `GMT${offsetSign}${offsetHours}`;

    // Build the complete string
    const dateTimeString = `${dayName}, ${monthName} ${day} • ${formatTime(startHour, startMinute)} – ${formatTime(endHour, endMinute)} ${timezoneStr}`;

    console.log('Generated date/time string:', dateTimeString);

    // Update the element
    const timeElement = document.getElementById('setup-meeting-time');
    if (timeElement) {
        console.log('Time element found, updating...');
        timeElement.textContent = dateTimeString;
    } else {
        console.log('ERROR: setup-meeting-time element not found!');
    }
}

// ============================================
// DEVICE DROPDOWN FUNCTIONS
// ============================================

async function populateDeviceDropdowns() {
    try {
        // First, request permissions to get device labels
        if (!localStream) {
            await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        }

        // Now enumerate devices with labels
        const devices = await navigator.mediaDevices.enumerateDevices();

        console.log('All devices:', devices);

        const cameras = devices.filter(device => device.kind === 'videoinput');
        const microphones = devices.filter(device => device.kind === 'audioinput');
        const speakers = devices.filter(device => device.kind === 'audiooutput');

        console.log('Cameras:', cameras);
        console.log('Microphones:', microphones);
        console.log('Speakers:', speakers);

        // Populate camera list
        const cameraList = document.getElementById('waiting-camera-list');
        if (cameraList) {
            cameraList.innerHTML = '';
            cameras.forEach((device, index) => {
                const deviceItem = document.createElement('div');
                deviceItem.className = 'dropdown-device-item';
                deviceItem.innerHTML = `
                    <input type="radio" name="camera-device" id="camera-${index}" value="${device.deviceId}" ${index === 0 ? 'checked' : ''}>
                    <label for="camera-${index}">${device.label || `Camera ${index + 1}`}</label>
                `;
                deviceItem.querySelector('input').addEventListener('change', () => selectDevice('videoinput', device.deviceId));
                cameraList.appendChild(deviceItem);
            });
        }

        // Populate microphone list
        const micList = document.getElementById('waiting-mic-list');
        if (micList) {
            micList.innerHTML = '';
            microphones.forEach((device, index) => {
                const deviceItem = document.createElement('div');
                deviceItem.className = 'dropdown-device-item';
                deviceItem.innerHTML = `
                    <input type="radio" name="mic-device" id="mic-${index}" value="${device.deviceId}" ${index === 0 ? 'checked' : ''}>
                    <label for="mic-${index}">${device.label || `Microphone ${index + 1}`}</label>
                `;
                deviceItem.querySelector('input').addEventListener('change', () => selectDevice('audioinput', device.deviceId));
                micList.appendChild(deviceItem);
            });
        }

        // Populate speaker list
        const speakerList = document.getElementById('waiting-speaker-list');
        if (speakerList) {
            speakerList.innerHTML = '';
            speakers.forEach((device, index) => {
                const deviceItem = document.createElement('div');
                deviceItem.className = 'dropdown-device-item';
                deviceItem.innerHTML = `
                    <input type="radio" name="speaker-device" id="speaker-${index}" value="${device.deviceId}" ${index === 0 ? 'checked' : ''}>
                    <label for="speaker-${index}">${device.label || `Speaker ${index + 1}`}</label>
                `;
                deviceItem.querySelector('input').addEventListener('change', () => selectDevice('audiooutput', device.deviceId));
                speakerList.appendChild(deviceItem);
            });
        }
    } catch (error) {
        console.error('Error enumerating devices:', error);
    }
}

function toggleWaitingCameraDropdown(e) {
    e.stopPropagation();
    const menu = document.getElementById('waiting-camera-menu');
    const micMenu = document.getElementById('waiting-mic-menu');
    if (micMenu) micMenu.style.display = 'none';
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

function toggleWaitingMicDropdown(e) {
    e.stopPropagation();
    const menu = document.getElementById('waiting-mic-menu');
    const cameraMenu = document.getElementById('waiting-camera-menu');
    if (cameraMenu) cameraMenu.style.display = 'none';
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

async function selectDevice(kind, deviceId) {
    try {
        const constraints = {
            video: kind === 'videoinput' ? { deviceId: { exact: deviceId } } : isCameraOn,
            audio: kind === 'audioinput' ? { deviceId: { exact: deviceId } } : true
        };

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);

        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }

        localStream = newStream;

        // Update video preview if on setup screen
        const setupVideo = document.getElementById('setup-video');
        if (setupVideo && kind === 'videoinput') {
            setupVideo.srcObject = localStream;
        }

        console.log(`Switched to ${kind}: ${deviceId}`);
    } catch (error) {
        console.error('Error switching device:', error);
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    if (timerInterval) {
        clearInterval(timerInterval);
    }
});

// ============================================
// VIRTUAL PARTICIPANTS (P2, P3) - WEBRTC STREAMING
// ============================================

// Virtual peers storage: virtualId -> { peerConnections: Map<participantId, RTCPeerConnection>, stream: MediaStream }
const virtualPeers = new Map();

// For participants: virtualId -> { stream: MediaStream }
const virtualStreams = new Map();

// Initialize virtual participants for host
function initVirtualParticipants() {
    if (!isHost) return;

    console.log('Initializing virtual participants...');

    // Get P2 and P3 names from session storage (set by host-setup)
    p2Name = sessionStorage.getItem('participant2Name') || 'Participant 2';
    p2Initials = getInitials(p2Name);

    // P3 info is already loaded from session storage in init()
    // participant3Name, participant3Initials

    // Check if P2 videos are available
    if (p2Video1Element || p2Video2Element) {
        console.log('P2 videos found, registering virtual P2');
        registerVirtualParticipant('virtual-p2', p2Name, p2Initials);
    }

    // P3 is handled by the slot2 system, but we can also stream it
    if ((p3Video1Element || p3Video2Element) && slot2Mode === 'participant3') {
        console.log('P3 videos found, will stream via slot2 system');
    }
}

// Register a virtual participant with the server
function registerVirtualParticipant(virtualId, name, initials) {
    console.log(`Registering virtual participant: ${virtualId} (${name})`);

    socket.emit('register-virtual-participant', {
        virtualId: virtualId,
        name: name,
        initials: initials
    });

    // Initialize storage for this virtual participant
    virtualPeers.set(virtualId, {
        peerConnections: new Map(),
        currentStream: null,
        name: name,
        initials: initials
    });
}

// Create peer connection for virtual participant to a real participant
async function createVirtualPeerConnection(virtualId, participantId) {
    if (!isHost) return null;

    console.log(`Creating virtual peer ${virtualId} -> ${participantId}`);

    const virtualPeer = virtualPeers.get(virtualId);
    if (!virtualPeer) {
        console.error(`Virtual peer ${virtualId} not found`);
        return null;
    }

    const peer = new RTCPeerConnection(ICE_SERVERS);
    virtualPeer.peerConnections.set(participantId, peer);

    // Get the appropriate video stream
    let videoStream = await getVirtualParticipantStream(virtualId);

    if (videoStream) {
        const tracks = videoStream.getTracks();
        console.log(`Adding ${tracks.length} tracks from virtual ${virtualId} to peer ${participantId}`);
        tracks.forEach(track => {
            peer.addTrack(track, videoStream);
        });
    }

    // Handle ICE candidates
    peer.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('virtual-ice-candidate', {
                virtualId: virtualId,
                to: participantId,
                candidate: event.candidate
            });
        }
    };

    // Monitor connection state
    peer.onconnectionstatechange = () => {
        if (peer.connectionState === 'connected' || peer.connectionState === 'failed') {
            console.log(`Virtual ${virtualId} -> ${participantId} connection: ${peer.connectionState}`);
        }
    };

    // Create and send offer
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    socket.emit('virtual-offer', {
        virtualId: virtualId,
        to: participantId,
        offer: offer
    });

    return peer;
}

// Get stream for a virtual participant
async function getVirtualParticipantStream(virtualId) {
    let videoElement = null;
    let mode = 'stop';

    if (virtualId === 'virtual-p2') {
        if (p2VideoMode === 'video1' && p2Video1Element) {
            videoElement = p2Video1Element;
            mode = 'video1';
        } else if (p2VideoMode === 'video2' && p2Video2Element) {
            videoElement = p2Video2Element;
            mode = 'video2';
        }
    } else if (virtualId === 'virtual-p3') {
        if (participant3VideoMode === 'video1' && p3Video1Element) {
            videoElement = p3Video1Element;
            mode = 'video1';
        } else if (participant3VideoMode === 'video2' && p3Video2Element) {
            videoElement = p3Video2Element;
            mode = 'video2';
        }
    }

    if (videoElement && mode !== 'stop') {
        try {
            // Wait for video to be ready
            if (videoElement.readyState < 2) {
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error('Video load timeout')), 10000);
                    videoElement.onloadeddata = () => {
                        clearTimeout(timeout);
                        resolve();
                    };
                    videoElement.onerror = () => {
                        clearTimeout(timeout);
                        reject(new Error('Video load error'));
                    };
                    videoElement.load();
                });
            }

            await videoElement.play();
            const stream = videoElement.captureStream ? videoElement.captureStream() : videoElement.mozCaptureStream();
            console.log(`Got stream for ${virtualId}: ${stream.getTracks().length} tracks`);
            return stream;
        } catch (error) {
            console.error(`Error getting stream for ${virtualId}:`, error);
        }
    }

    // Return black canvas stream with silent audio for stop mode
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const canvasStream = canvas.captureStream(1);

    // Add silent audio track so we have an audio sender to replace later
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        gain.gain.value = 0; // silent
        oscillator.connect(gain);
        const dest = audioCtx.createMediaStreamDestination();
        gain.connect(dest);
        oscillator.start();
        const silentAudioTrack = dest.stream.getAudioTracks()[0];
        canvasStream.addTrack(silentAudioTrack);
    } catch (e) {
        console.log('Could not add silent audio track:', e);
    }

    return canvasStream;
}

// Update virtual participant video stream
async function updateVirtualParticipantStream(virtualId) {
    if (!isHost) return;

    const virtualPeer = virtualPeers.get(virtualId);
    if (!virtualPeer) return;

    console.log(`Updating stream for ${virtualId}`);

    const newStream = await getVirtualParticipantStream(virtualId);

    // Replace video AND audio tracks in all peer connections
    for (const [participantId, peer] of virtualPeer.peerConnections.entries()) {
        const senders = peer.getSenders();

        if (newStream) {
            // Replace video track
            const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
            const newVideoTrack = newStream.getVideoTracks()[0];
            if (videoSender && newVideoTrack) {
                try {
                    await videoSender.replaceTrack(newVideoTrack);
                    console.log(`Replaced video track for ${virtualId} -> ${participantId}`);
                } catch (error) {
                    console.error(`Error replacing video track for ${virtualId}:`, error);
                }
            }

            // Replace audio track
            const audioSender = senders.find(sender => sender.track && sender.track.kind === 'audio');
            const newAudioTrack = newStream.getAudioTracks()[0];
            if (audioSender && newAudioTrack) {
                try {
                    await audioSender.replaceTrack(newAudioTrack);
                    console.log(`Replaced audio track for ${virtualId} -> ${participantId}`);
                } catch (error) {
                    console.error(`Error replacing audio track for ${virtualId}:`, error);
                }
            }
        }
    }

    // Notify participants about video state change
    socket.emit('virtual-video-update', {
        virtualId: virtualId,
        videoMode: virtualId === 'virtual-p2' ? p2VideoMode : participant3VideoMode
    });
}

// Switch P2 video mode
async function switchP2Video(mode) {
    if (!isHost) return;

    console.log('Switching P2 video to:', mode);
    p2VideoMode = mode;

    // Update button states
    const buttons = document.querySelectorAll('#p2-video-controls .video-control-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-p2-${mode}`);
    if (activeBtn) activeBtn.classList.add('active');

    // Update the stream for all connected participants
    await updateVirtualParticipantStream('virtual-p2');

    // Refresh P2 display locally
    refreshP2Display();
}

// Refresh P2 display (local view for host)
function refreshP2Display() {
    const existingP2 = document.getElementById('video-virtual-p2');
    if (existingP2) {
        existingP2.remove();
    }

    // Only show P2 if videos are available
    if (!p2Video1Element && !p2Video2Element) return;

    addVirtualParticipantDisplay('virtual-p2', p2Name, p2Initials, p2VideoMode);
}

// Add virtual participant display to video grid
function addVirtualParticipantDisplay(virtualId, name, initials, videoMode) {
    // Remove existing if present
    const existing = document.getElementById(`video-${virtualId}`);
    if (existing) existing.remove();

    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    videoContainer.id = `video-${virtualId}`;

    if (videoMode === 'stop') {
        // Show avatar
        const avatar = document.createElement('div');
        avatar.className = 'video-avatar';
        avatar.innerHTML = `<div class="video-avatar-circle">${initials}</div>`;
        videoContainer.appendChild(avatar);
    } else {
        // Show video
        let videoElement = null;
        if (virtualId === 'virtual-p2') {
            videoElement = videoMode === 'video1' ? p2Video1Element : p2Video2Element;
        } else if (virtualId === 'virtual-p3') {
            videoElement = videoMode === 'video1' ? p3Video1Element : p3Video2Element;
        }

        if (videoElement && isHost) {
            // Host has the video locally
            const videoClone = videoElement.cloneNode(true);
            videoClone.style.width = '100%';
            videoClone.style.height = '100%';
            videoClone.style.objectFit = 'cover';
            videoContainer.appendChild(videoClone);
            videoClone.play().catch(e => console.error(`Error playing ${virtualId} video:`, e));
        } else if (virtualStreams.has(virtualId)) {
            // Participant receiving stream
            const video = document.createElement('video');
            video.srcObject = virtualStreams.get(virtualId);
            video.autoplay = true;
            video.playsInline = true;
            videoContainer.appendChild(video);
        } else {
            // No video available, show indicator
            const indicator = document.createElement('div');
            indicator.className = 'video-avatar';
            indicator.innerHTML = `
                <div class="video-avatar-circle" style="position: relative;">
                    ${initials}
                    <div style="position: absolute; bottom: -5px; right: -5px; width: 20px; height: 20px; background: #107c10; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                </div>
            `;
            videoContainer.appendChild(indicator);
        }
    }

    const nameTag = createNameTag(name, false, false, false);
    videoContainer.appendChild(nameTag);

    videoGrid.appendChild(videoContainer);
}

// Setup socket events for virtual participants
function setupVirtualParticipantSocketEvents() {
    // For participants: receive virtual participant joined
    socket.on('virtual-participant-joined', (data) => {
        console.log('Virtual participant joined:', data);

        if (!isHost) {
            // Add display for virtual participant
            addVirtualParticipantDisplay(data.virtualId, data.name, data.initials, 'stop');
        }
    });

    // For participants: receive virtual participant left
    socket.on('virtual-participant-left', (data) => {
        console.log('Virtual participant left:', data.virtualId);
        const container = document.getElementById(`video-${data.virtualId}`);
        if (container) container.remove();
        virtualStreams.delete(data.virtualId);
    });

    // For participants: receive virtual offer
    socket.on('virtual-offer', async (data) => {
        if (isHost) return; // Host doesn't receive these

        console.log(`Received virtual offer for ${data.virtualId}`);

        try {
            const peer = new RTCPeerConnection(ICE_SERVERS);

            // Store the peer connection
            virtualStreams.set(data.virtualId + '-peer', peer);

            // Handle incoming stream
            peer.ontrack = (event) => {
                console.log(`Received track from ${data.virtualId}:`, event.track.kind);
                const [stream] = event.streams;
                virtualStreams.set(data.virtualId, stream);

                // Update display - find or create container
                let container = document.getElementById(`video-${data.virtualId}`);

                if (!container) {
                    // Container doesn't exist yet - create it
                    console.log(`Creating container for ${data.virtualId} from ontrack`);
                    container = document.createElement('div');
                    container.className = 'video-container';
                    container.id = `video-${data.virtualId}`;
                    if (videoGrid) videoGrid.appendChild(container);
                }

                // If video element already exists with stream, skip recreation
                const existingVideo = container.querySelector('video');
                if (existingVideo && existingVideo.srcObject) {
                    return;
                }

                const nameTag = container.querySelector('.video-name-tag');
                container.innerHTML = '';

                const video = document.createElement('video');
                video.srcObject = stream;
                video.autoplay = true;
                video.playsInline = true;
                container.appendChild(video);

                if (nameTag) container.appendChild(nameTag);

                // Play after DOM insertion
                video.play().catch(e => console.log('Virtual video play error:', e));

                // Also create a hidden audio element as fallback for audio playback
                const audio = document.createElement('audio');
                audio.srcObject = stream;
                audio.autoplay = true;
                container.appendChild(audio);
                audio.play().catch(e => console.log('Virtual audio play error:', e));
            };

            // Handle ICE candidates
            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('virtual-ice-candidate', {
                        virtualId: data.virtualId,
                        toHost: true,
                        candidate: event.candidate
                    });
                }
            };

            // Set remote description and create answer
            await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            socket.emit('virtual-answer', {
                virtualId: data.virtualId,
                answer: answer
            });

            console.log(`Virtual peer ${data.virtualId} answer sent successfully`);
        } catch (error) {
            console.error(`Error handling virtual offer for ${data.virtualId}:`, error);
        }
    });

    // For host: receive virtual answer
    socket.on('virtual-answer', async (data) => {
        if (!isHost) return;

        console.log(`Received virtual answer for ${data.virtualId} from ${data.from}`);

        const virtualPeer = virtualPeers.get(data.virtualId);
        if (virtualPeer) {
            const peer = virtualPeer.peerConnections.get(data.from);
            if (peer) {
                await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
                console.log(`Virtual peer ${data.virtualId} -> ${data.from} connected`);
            }
        }
    });

    // Handle ICE candidates for virtual peers
    socket.on('virtual-ice-candidate', async (data) => {
        if (isHost) {
            // Host receives ICE from participant
            const virtualPeer = virtualPeers.get(data.virtualId);
            if (virtualPeer) {
                const peer = virtualPeer.peerConnections.get(data.from);
                if (peer && data.candidate) {
                    await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
                }
            }
        } else {
            // Participant receives ICE from host
            const peer = virtualStreams.get(data.virtualId + '-peer');
            if (peer && data.candidate) {
                await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        }
    });

    // For participants: receive virtual video update
    socket.on('virtual-video-update', (data) => {
        if (isHost) return;

        console.log('Virtual video update:', data);

        const container = document.getElementById(`video-${data.virtualId}`);
        if (!container) return;

        const nameTag = container.querySelector('.video-name-tag');
        const audioEl = container.querySelector('audio');

        if (data.videoMode === 'stop') {
            // Show avatar, preserve audio
            const name = nameTag ? nameTag.querySelector('span').textContent : 'P';
            const initials = getInitials(name);

            container.innerHTML = '';
            const avatar = document.createElement('div');
            avatar.className = 'video-avatar';
            avatar.innerHTML = `<div class="video-avatar-circle">${initials}</div>`;
            container.appendChild(avatar);
            if (audioEl) container.appendChild(audioEl);
            if (nameTag) container.appendChild(nameTag);
        } else {
            // Video mode (video1 or video2) - show video from stream
            const stream = virtualStreams.get(data.virtualId);
            if (stream) {
                container.innerHTML = '';

                const video = document.createElement('video');
                video.srcObject = stream;
                video.autoplay = true;
                video.playsInline = true;
                container.appendChild(video);

                const audio = document.createElement('audio');
                audio.srcObject = stream;
                audio.autoplay = true;
                container.appendChild(audio);

                if (nameTag) container.appendChild(nameTag);

                video.play().catch(e => console.log('Virtual video play:', e));
                audio.play().catch(e => console.log('Virtual audio play:', e));
            }
        }
    });
}

// Call this in init() or when entering meeting
function initVirtualParticipantListeners() {
    setupVirtualParticipantSocketEvents();
}

// When a new participant joins, create virtual peer connections for them
function createVirtualPeersForNewParticipant(participantId) {
    if (!isHost) return;

    // Create connections for each registered virtual participant
    for (const [virtualId, virtualPeer] of virtualPeers.entries()) {
        console.log(`Creating virtual peer ${virtualId} for new participant ${participantId}`);
        createVirtualPeerConnection(virtualId, participantId);
    }
}

// Add P2 control section to the host video control panel
function addP2ControlSection() {
    const videoControlPanel = document.getElementById('host-video-control');
    if (!videoControlPanel || !isHost) return;

    // Check if P2 controls already exist
    if (document.getElementById('p2-video-controls')) return;

    // Check if P2 videos are available
    if (!p2Video1URL && !p2Video2URL) return;

    const controlContent = document.getElementById('control-panel-content');
    if (!controlContent) return;

    // Create P2 control section
    const p2Section = document.createElement('div');
    p2Section.className = 'video-control-section';
    p2Section.innerHTML = `
        <h5 style="margin-bottom: 8px; font-size: 12px; color: #c7c7c7;">Participant 2 Video Control</h5>
        <div class="video-control-buttons" id="p2-video-controls">
            <button class="video-control-btn active" id="btn-p2-stop" onclick="switchP2Video('stop')">
                <i class="fas fa-stop"></i>
                <span>Stop</span>
            </button>
            <button class="video-control-btn" id="btn-p2-video1" onclick="switchP2Video('video1')">
                <i class="fas fa-video"></i>
                <span>Video 1</span>
            </button>
            <button class="video-control-btn" id="btn-p2-video2" onclick="switchP2Video('video2')">
                <i class="fas fa-video"></i>
                <span>Video 2</span>
            </button>
        </div>
    `;

    controlContent.appendChild(p2Section);
}

// ============================================
// FRED SLOT PARTICIPANT CONTROL FUNCTIONS
// ============================================

// Show/hide Fred slot participant control panel
function showFredParticipantControlPanel() {
    const panel = document.getElementById('fred-participant-control');
    if (panel && participantRole === 'fred') {
        panel.style.display = 'block';
        // Pre-fill the name input with the participant's name
        const nameInput = document.getElementById('my-participant-name');
        if (nameInput && userName) {
            nameInput.value = userName;
            myParticipantDisplayName = userName;
        }
        console.log('Fred slot participant control panel shown');
    }
}

// Toggle Fred participant control panel (minimize/maximize)
function toggleFredParticipantPanel() {
    const content = document.getElementById('fred-participant-panel-content');
    const btn = document.getElementById('btn-minimize-fred-panel');

    if (content.style.display === 'none') {
        content.style.display = 'block';
        btn.textContent = '−';
        btn.title = 'Réduire';
    } else {
        content.style.display = 'none';
        btn.textContent = '+';
        btn.title = 'Agrandir';
    }
}

// Switch between Fred mode and Participant mode
function switchMyFredMode(mode) {
    if (participantRole !== 'fred') return;

    console.log('Switching my Fred mode to:', mode);
    myFredMode = mode;

    // Update mode buttons
    const btnFred = document.getElementById('btn-my-mode-fred');
    const btnParticipant = document.getElementById('btn-my-mode-participant');

    if (btnFred) btnFred.classList.toggle('active', mode === 'fred');
    if (btnParticipant) btnParticipant.classList.toggle('active', mode === 'participant');

    // Show/hide name input
    const nameInput = document.getElementById('my-participant-name-input');
    if (nameInput) nameInput.style.display = mode === 'participant' ? 'block' : 'none';

    // Broadcast mode change to all participants
    socket.emit('fred-slot-mode-change', {
        mode: mode,
        displayName: mode === 'fred' ? 'Fred' : (myParticipantDisplayName || userName),
        initials: mode === 'fred' ? 'F' : getInitials(myParticipantDisplayName || userName)
    });

    // Update local display
    updateMyFredSlotDisplay();
}

// Update participant name when typing
function updateMyParticipantName() {
    const input = document.getElementById('my-participant-name');
    if (input) {
        myParticipantDisplayName = input.value.trim() || userName;
        console.log('Updated my display name:', myParticipantDisplayName);

        // Broadcast if in participant mode
        if (myFredMode === 'participant') {
            socket.emit('fred-slot-mode-change', {
                mode: 'participant',
                displayName: myParticipantDisplayName,
                initials: getInitials(myParticipantDisplayName)
            });
        }
    }
}

// Update local Fred slot display based on mode
function updateMyFredSlotDisplay() {
    const videoContainer = document.getElementById('video-sarah');
    if (!videoContainer) return;

    // Update name tag
    const nameTag = videoContainer.querySelector('.video-name-tag');
    if (nameTag) {
        const nameSpan = nameTag.querySelector('span');
        if (nameSpan) {
            nameSpan.textContent = myFredMode === 'fred' ? 'Fred' : (myParticipantDisplayName || userName);
        }
    }

    // Handle Fred message
    if (myFredMode === 'fred') {
        // Add Fred message if not present
        if (!sarahMessageAdded) {
            addSarahInitialMessage();
        }
    } else {
        // Remove Fred message
        removeFredMessage();
    }
}

// Switch video source for Fred slot participant
function switchMyVideo(mode) {
    if (participantRole !== 'fred') return;

    // Reuse the existing switchHostVideo logic but for participant
    switchHostVideo(mode);
}

// ============================================
// DEBUG OVERLAY (temporary - remove after fixing)
// ============================================
(function() {
    const dbg = document.createElement('div');
    dbg.id = 'debug-overlay';
    dbg.style.cssText = 'position:fixed;bottom:5px;left:5px;background:rgba(0,0,0,0.85);color:#0f0;font:11px monospace;padding:8px 12px;border-radius:6px;z-index:99999;max-width:350px;pointer-events:none;';
    document.body.appendChild(dbg);

    function update() {
        const lines = [];
        lines.push('v4 | Socket: ' + (socket.connected ? 'OK (' + socket.id + ')' : 'DISCONNECTED'));
        lines.push('Media: ' + (localStream ? localStream.getTracks().map(t => t.kind + '=' + (t.enabled ? 'on' : 'off')).join(', ') : 'NONE'));
        lines.push('Screen: ' + currentScreen + ' | Host: ' + isHost);

        const peerList = [];
        for (const [id, peer] of peers.entries()) {
            peerList.push(id.substring(0, 6) + ':' + (peer.iceConnectionState || '?'));
        }
        lines.push('Peers(' + peers.size + '): ' + (peerList.length ? peerList.join(', ') : 'none'));

        const vpList = [];
        if (typeof virtualPeers !== 'undefined') {
            for (const [vid, vp] of virtualPeers.entries()) {
                vpList.push(vid.substring(0, 8));
            }
        }
        if (vpList.length) lines.push('VPeers: ' + vpList.join(', '));

        dbg.innerHTML = lines.join('<br>');
        requestAnimationFrame(update);
    }
    update();
})();
