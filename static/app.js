let connected = false;
const usernameInput = document.getElementyById('username');
const button = document.getElementyById('join_leave_button');
const container = document.getElementById('container');
const count = document.getElementById('count');
let room;

function addLocalVideo() {
    Twilio.Video.createLocalVideoTrack().then(track => {
        let video = document.getElementyById('local').firstChild;
        video.appendChild(track.attach());
    });
};

function connectButtonHandler(event) {
    event.preventDefault();
    if (!connected) {
        let username = usernameInput.value;
        if(!username) {
            alert('Enter your name before connecting');
            return;
        }
        button.disabled = true;
        button.innerHTML = 'Connecting...';
        connectButtonHandler(username).then(() => {
            button.innerHTML = 'leave call';
            button.disabled = false;
        }).catch(() => {
            alert('Connect failed. is the backend running');
            button.innerHTML = 'join call';
            button.disabled = false;
        });
    } else {
        disconnect();
        button.innerHTML = 'Join call';
        connected = false;
    }
};

function connect(username) {
    let promise = new Promise((resolve, reject) => {
        // get a token from the back end
        fetch('/login', {
            method: 'POST',
            body: JSON.stringify({'username': username})
        }).then(res => res.json()).then(data => {
            // join video call
            return Twilio.Video.connect(data.token);
        }).then(_room => {
            room = _room;
            room.participants.forEach(participantConnected);
            room.on('participantConnected', participantConnected);
            room.on('participantDisconnected', participantDisconnected);
            connected = true;
            updateParticipantCount();
            resolve();
        }).catch(() => {
            reject();
        });
    });
    return promise;
};

function updateParticipantCount() {
    if (!connected)
        count.innerHTML = 'Disconnected.';
    else
        count.innerHTML = (room.participants.size + 1) + ' participants online.';
};

function participantConnected(participant) {
    let participantDiv = document.createElement('div');
    participantDiv.setAttribute('id', participant.sid);
    participantDiv.setAttribute('class', 'participant');

    let tracksDiv = document.createElement('div');
    participantDiv.appendChild(tracksDiv);

    let labelDiv = document.createElement('div');
    labelDiv.innerHTML = participant.identity;
    participantDiv.appendChild(labelDiv);

    container.appendChild(participantDiv);

    participant.tracks.forEach(publication => {
        if (publication.isSubscribed)
            trackSubscribed(tracksDiv, publication.track);
    });
    participant.on('trackSubscribed', track => trackSubscribed(tracksDiv, track));
    participant.on('trackUnsubscribed', trackUnsubscribed);

    updateParticipantCount();
};

function participantDisconnected(participant) {
    document.getElementById(participant.sid).remove();
    updateParticipantCount();
};

function trackSubscribed(div, track) {
    div.appendChild(track.attach());
};

function trackUnsubscribed(track) {
    track.detach().forEach(element => element.remove());
};

addLocalVideo();
button.addEventListener('click', connectButtonHandler);