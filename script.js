const correctPassword = "1234";
let micStream;
let micOn = false;
let seconds = 0;
let timerInterval;

function checkLogin() {
    const name = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value;
    const error = document.getElementById("error");

    if (!name) {
        error.innerText = "Name required!";
        return;
    }

    if (pass === correctPassword) {
        document.getElementById("loginBox").classList.add("hidden");
        document.getElementById("callBox").classList.remove("hidden");

        addUser(name);
        startTimer();
    } else {
        error.innerText = "Wrong password!";
    }
}

function addUser(name) {
    const userList = document.getElementById("userList");
    const li = document.createElement("li");
    li.innerText = name + " (You)";
    userList.appendChild(li);
}

async function toggleMic() {
    const btn = document.getElementById("micBtn");
    const status = document.getElementById("status");

    if (!micOn) {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micOn = true;
        btn.innerText = "Mic ON";
        status.innerText = "Microphone Enabled";
    } else {
        micStream.getTracks().forEach(track => track.stop());
        micOn = false;
        btn.innerText = "Mic OFF";
        status.innerText = "Microphone Muted";
    }
}

function startTimer() {
    timerInterval = setInterval(() => {
        seconds++;
        let min = String(Math.floor(seconds / 60)).padStart(2, "0");
        let sec = String(seconds % 60).padStart(2, "0");
        document.getElementById("timer").innerText = `${min}:${sec}`;
    }, 1000);
}

function endCall() {
    clearInterval(timerInterval);
    if (micStream) micStream.getTracks().forEach(t => t.stop());
    location.reload();
}
