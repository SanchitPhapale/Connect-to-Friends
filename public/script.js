const socket = io();
const correctPassword = "1234";

let localStream;
let peers = {};
let seconds = 0;
let timerInterval;
let micEnabled = true;

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

// LOGIN
async function checkLogin() {
  const name = username.value.trim();
  const pass = password.value;

  if (!name) return alert("Enter name");
  if (pass !== correctPassword) return alert("Wrong password");

  loginBox.classList.add("hidden");
  callBox.classList.remove("hidden");

  // 🔥 Strong Mobile Echo Reduction
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1,
      sampleRate: 48000,
      sampleSize: 16
    }
  });

  socket.emit("join", name);
  startTimer();
}

// ALL USERS
socket.on("all-users", (users) => {
  userList.innerHTML = "";

  users.forEach(user => {
    addUser(user);

    if (user.id !== socket.id) {
      createPeer(user.id, true);
    }
  });
});

// NEW USER
socket.on("user-joined", (user) => {
  addUser(user);
  createPeer(user.id, false);
});

// OFFER
socket.on("offer", async (data) => {
  const peer = createPeer(data.sender, false);

  await peer.setRemoteDescription(new RTCSessionDescription(data.offer));

  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);

  socket.emit("answer", {
    answer,
    target: data.sender
  });
});

// ANSWER
socket.on("answer", async (data) => {
  if (peers[data.sender]) {
    await peers[data.sender].setRemoteDescription(
      new RTCSessionDescription(data.answer)
    );
  }
});

// ICE
socket.on("ice", (data) => {
  if (peers[data.sender]) {
    peers[data.sender].addIceCandidate(
      new RTCIceCandidate(data.candidate)
    );
  }
});

// USER LEFT
socket.on("user-left", (id) => {
  document.querySelectorAll("#userList li").forEach(li => {
    if (li.dataset.id === id) li.remove();
  });

  if (peers[id]) {
    peers[id].close();
    delete peers[id];
  }
});

// CREATE PEER
function createPeer(targetId, initiator) {
  if (peers[targetId]) return peers[targetId];

  const peer = new RTCPeerConnection(config);
  peers[targetId] = peer;

  if (localStream) {
    localStream.getTracks().forEach(track => {
      peer.addTrack(track, localStream);
    });
  }

  peer.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice", {
        candidate: event.candidate,
        target: targetId
      });
    }
  };

  // 🔥 Better Mobile Audio Handling
  peer.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      remoteAudio.srcObject = event.streams[0];
      remoteAudio.setAttribute("playsinline", true);
      remoteAudio.muted = false;
      remoteAudio.volume = 0.8; // full volume avoid
    }
  };

  if (initiator) createOffer(peer, targetId);

  return peer;
}

// CREATE OFFER
async function createOffer(peer, targetId) {
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);

  socket.emit("offer", {
    offer,
    target: targetId
  });
}

// ADD USER UI
function addUser(user) {
  if (document.querySelector(`li[data-id='${user.id}']`)) return;

  const li = document.createElement("li");
  li.innerText = user.name;
  li.dataset.id = user.id;
  userList.appendChild(li);
}

// MIC TOGGLE
function toggleMic() {
  if (!localStream) return;

  localStream.getAudioTracks().forEach(track => {
    track.enabled = !track.enabled;
  });

  micEnabled = !micEnabled;
  micBtn.innerText = micEnabled ? "Mic ON" : "Mic OFF";
}

// TIMER
function startTimer() {
  timerInterval = setInterval(() => {
    seconds++;
    timer.innerText =
      String(Math.floor(seconds / 60)).padStart(2, "0") +
      ":" +
      String(seconds % 60).padStart(2, "0");
  }, 1000);
}

function endCall() {
  clearInterval(timerInterval);

  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
  }

  location.reload();
}
