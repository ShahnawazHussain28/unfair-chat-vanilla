PREFIX_KEY = "unfair-chat-"
const idKey = PREFIX_KEY + "id"

let id = localStorage.getItem(idKey);
if (!idKey) {
    window.location.href = '/login';
}

const socket = io('/', { query: { id } });

socket.on('connect', () => {
    document.querySelector("#myid").innerHTML = "Your ID: " + id;
})
socket.on('receive-message', ({ sender, text, time }) => {
    let newMsg;
    if(text.length > 200 && !text.includes(' '))
        newMsg = { dataURL: text, time: time, seen: false, fromMe: false };
    else 
        newMsg = { text: text, time: time, seen: false, fromMe: false };
    newMessage(sender, newMsg);
    if (sender == activeChatId) {
        bluetickEmit();
    }
})
socket.on('error', ({type, text}) => {
    if(type == "relogin") {
        localStorage.removeItem(PREFIX_KEY+"id")
        localStorage.removeItem(PREFIX_KEY+"dp")
        localStorage.removeItem(PREFIX_KEY+"conversations")
        activeChatId = ''
        window.location.href = "/"
    }
})
socket.on('blue-tick-update', ({ sender }) => {
    updateBlueTick(sender)
})
socket.on('onlineStatus', ({ id, online }) => {
    updateOnlineStatus(id, online)
})
socket.on('receive-typing', ({ sender, text }) => {
    updateTyping(sender, text);
})
socket.on('receive-stop-typing', ({sender}) => {
    updateStopTyping(sender)
})
function sendTypingEmit(id, text) {
    socket.emit('typing', {
        recipient: id,
        text: text,
    })
}
function sendStopTypingEmit(recipient) {
    socket.emit('stop-typing', {
        recipient
    })
}
function sendMessageEmit(id, message) {
    if(message.dataURL)
        socket.emit('send-message', {
            recipient: id,
            text: message.dataURL,
            time: message.time
        })
    else 
        socket.emit('send-message', {
            recipient: id,
            text: message.text,
            time: message.time
        })
}

function bluetickEmit() {
    socket.emit('blue-tick', {
        recipient: activeChatId,
        sender: id
    })
}
function talkingToEmit(id, name){
    socket.emit('set-talking-to', {
        talkingId: id,
        talkingName: name 
    })
}
