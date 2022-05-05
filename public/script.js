let activeChatId = ''
const PREFIX_KEY = "unfair-chat-"
let myId = localStorage.getItem(PREFIX_KEY+"id")
const conversationKey = PREFIX_KEY + "conversations"
const createContactForm = document.querySelector("#createcontactform")
let conversations = JSON.parse(localStorage.getItem(conversationKey))
let chatElem = document.querySelector("#chat");
let openConversation = document.querySelector("#openconversation")
let msg = document.querySelector('#msg')
let headerNumber = document.querySelector("#headerNumber")

const chatboxForm = document.querySelector("#chatbox")
let statusElem = document.querySelector("#status")
let sideBar = document.querySelector('#sidebar')
let picElem = document.querySelector("#pic")
let nameElem = document.querySelector("#name")
let fullscreenElem = document.querySelector("#fullscreen")

reRenderConversationsList();
openConversation.style.display = "none";
let loadedMessagesCount = 0;

document.onfullscreenchange = (e) => {
    if(!document.fullscreenElement) {
        fullscreenElem.firstChild.className = "fa fa-expand";
    } else {
        fullscreenElem.firstChild.className = "fa fa-compress";
    }
}
document.querySelector("#fullscreen").addEventListener('click', (e) => {
    if (e.target.firstChild.className == "fa fa-expand") {
        document.querySelector("#container").requestFullscreen();
        e.target.firstChild.className = "fa fa-compress";
    } else {
        document.exitFullscreen();
        e.target.firstChild.className = "fa fa-expand"
    }
})
createContactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let data = {
        id: document.querySelector("#createId").value,
        name: document.querySelector("#createName").value,
    }
    createContactForm.reset();
    createContact(data);
})
document.querySelector("#saveContact").addEventListener('submit', (e) => {
    e.preventDefault();
    saveContact();
})
document.querySelector("#namestatus").addEventListener('click', async () => {
    if (!activeChatId) return
    let dp = '', talkingToId = '', talkingToName;
    const dpRes = await fetch("/getdp/" + activeChatId)
    const dpData = await dpRes.json()
    if(dpData && dpData.dp){
        dp = dpData.dp
        picElem.innerHTML = dp
    }
    const talkingToRes = await fetch("/getTalkingTo/" + activeChatId)
    const talkingToData = await talkingToRes.json()
    if(talkingToData && talkingToData.id) {
        talkingToId = talkingToData.id
        talkingToName = talkingToData.name
    }
    if(!talkingToId) talkingToName = 'Not Available'
    displayDetailsModal(dp, talkingToId, talkingToName);
})
document.querySelectorAll(".emoji").forEach(emojiElem => {
    emojiElem.addEventListener('click', () => {
        setDP(emojiElem);
    });
})

chatboxForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let msgText = msg.value.trim();
    if (!msgText) {
        msg.value = '';
        msg.focus();
        return;
    }
    var options = {
        hour: "2-digit",
        minute: "2-digit"
    }
    let d = new Date()
    const time = d.toLocaleTimeString("en-us", options)
    const message = { text: msgText, time: time, seen: false, fromMe: true };
    sendMessage(activeChatId, message);
    msg.value = '';
    msg.focus();
})

function newMessage(id, message) {
    let idFound = false;
    document.querySelector("#ghost")?.remove();
    if (!conversations) conversations = [{ id, messages: [message], read: false }];
    let foundConversation = conversations.filter(conversation => conversation.id == id)
    if (foundConversation.length > 0) {
        idFound = true;
        let index = conversations.indexOf(foundConversation[0]);
        conversations.splice(index, 1);
        foundConversation[0].messages.unshift(message);
        foundConversation[0].read = id == activeChatId ? true : false;
        conversations.unshift(foundConversation[0]);
    }
    if (idFound == false) {
        conversations = [{ id, messages: [message], read: false }, ...conversations];
    }
    setConversations(conversations);

    if (id == activeChatId) {
        reRenderConversationsList();
        addMessageToChat(message);
    } else {
        reRenderConversationsList();
        document.querySelector(`[data-chat-id = '${id}']`).querySelector(".unread").classList.add("active");
    }
}


function sendMessage(id, message) {
    if (!activeChatId) return;
    let foundConversation = conversations.filter(conversation => conversation.id == id)
    if (foundConversation.length > 0) {
        let index = conversations.indexOf(foundConversation[0]);
        conversations.splice(index, 1);
        foundConversation[0].messages.unshift(message);
        foundConversation[0].read = true;
        conversations.unshift(foundConversation[0]);
    } else return;
    setConversations(conversations);
    if (id == activeChatId) {
        reRenderConversationsList();
        addMessageToChat(message);
    }
    sendMessageEmit(id, message);
}

function createContact({ id, name }) {
    if (!conversations) {
        conversations = [{ id, name, messages: [], read: true }];
        setConversations(conversations);
        reRenderConversationsList();
        return;
    }
    let idFound = false;
    conversations.forEach(conversation => {
        if (id == conversation.id) {
            idFound = true;
        }
    })
    if (idFound) return;
    conversations = [{ id, name, messages: [], read: true }, ...conversations];
    setConversations(conversations);
    reRenderConversationsList();
}

function setConversations(conv) {
    localStorage.setItem(conversationKey, JSON.stringify(conv));
}
function updateBlueTick(sender) {
    if(!conversations) return;
    for (let i = 0; i < conversations.length; i++) {
        const conversation = conversations[i];
        if (conversation.id == sender) {
            let unread = conversation.messages.filter(msg => msg.seen == false)
            unread.forEach(unreadMsg => {
                unreadMsg.seen = true;
            })
            if (activeChatId == sender) {
                reRenderChats();
            }
        }
    }
    setConversations(conversations);
}

function reRenderConversationsList() {
    document.querySelector("#mydp").innerHTML = localStorage.getItem(PREFIX_KEY+"dp") || '😒';
    if (!conversations) return;
    const parent = document.querySelector("#conversations");
    parent.innerHTML = "";
    conversations.forEach(conversation => {
        parent.innerHTML +=
        `<div class="conversation ${conversation.id == activeChatId ? 'active' : ''}" data-chat-id="${conversation.id}">
            <p class="name">${conversation.name || conversation.id}</p>
            <span class="unread ${conversation.read ? '' : 'active'}"></span>
        </div>`
    })

    addChangeChatFunction();
}

async function setOnlineStatus() {
    let conversationStatus;
    const res = await fetch("/onlineStatus/" + activeChatId)
    const data = await res.json()
    if (data && data.status) {
        let status = data.status
        if (status === 'online') conversationStatus = 'Online'
        else {
            var options = { hour: "2-digit", minute: "2-digit" }
            const d = new Date(status)
            const date = d.toLocaleDateString(options)
            const today = new Date();
            if (today.toLocaleDateString(options) === date) {
                const time = d.toLocaleTimeString("en-us", options)
                conversationStatus = "Last seen: " + time
            } else {
                const time = d.toLocaleTimeString("en-us", options)
                conversationStatus = date + " " + time
            }
        }
        statusElem.innerHTML = conversationStatus;
    } else {
        conversationStatus = '';
        statusElem.innerHTML = conversationStatus;
    }
}

function updateOnlineStatus(id, online){
    if (!conversations) return;
    if (activeChatId == id) {
        if (online) {
            statusElem.innerHTML = "online";
        } else {
            var options = { hour: "2-digit", minute: "2-digit" }
            let d = new Date()
            const time = d.toLocaleTimeString("en-us", options)
            statusElem = 'Last seen: '+ time;
        }
    }
}

function loadPreviousMessages(){
    let scrollVal = chatElem.offsetHeight - chatElem.scrollHeight
    let ran = false;
    for (let i = 0; i < conversations.length; i++) {
        const conversation = conversations[i];
        let msgLoaded = 0;
        if(conversation.id == activeChatId) {
            for (let j = loadedMessagesCount; j < (loadedMessagesCount+30) && j < conversation.messages.length; j++) {
                const message = conversation.messages[j];
                blueTickElem = message.fromMe ? `<span class="bluetick ${message.seen ? 'blue' : ''}">&#10003;</span>` : "";
                chatElem.innerHTML +=
                    `<div class='message ${message.fromMe ? 'right' : 'left'}'>
                        <div class="messagetext">${message.text}</div>
                        <span class="metadatacontainer">
                            ${blueTickElem}
                            <span class="time">${message.time}</span>
                        </span>
                    </div>`;
                msgLoaded++;
                ran = true;
            }
            loadedMessagesCount += msgLoaded;
            if (ran) chatElem.scrollTop = scrollVal - 100
            break;
        }
    }
}

function addMessageToChat(message) {
    if(chatElem.childElementCount > 30) chatElem.lastChild.remove();
    blueTickElem = message.fromMe ? `<span class="bluetick ${message.seen ? 'blue' : ''}">&#10003;</span>` : "";
    chatElem.innerHTML =
        `<div class='message ${message.fromMe ? 'right' : 'left'}'>
            <div class="messagetext">${message.text}</div>
            <span class="metadatacontainer">
                ${blueTickElem}
                <span class="time">${message.time}</span>
            </span>
        </div>` + chatElem.innerHTML;
    loadedMessagesCount++;
    scrollToBottom();
}

function reRenderChats() {
    chatElem.innerHTML = "";
    loadedMessagesCount = 0;
    for (let i = 0; i < conversations.length; i++) {
        const conversation = conversations[i];
        if (conversation.id == activeChatId) {
            for (let j = 0; j < 30 && j < conversation.messages.length; j++) {
                const message = conversation.messages[j];
                blueTickElem = message.fromMe ? `<span class="bluetick ${message.seen ? 'blue' : ''}">&#10003;</span>` : "";
                chatElem.innerHTML +=
                    `<div class='message ${message.fromMe ? 'right' : 'left'}'>
                        <div class="messagetext">${message.text}</div>
                        <span class="metadatacontainer">
                            ${blueTickElem}
                            <span class="time">${message.time}</span>
                        </span>
                    </div>`;
                loadedMessagesCount++;
            }
            scrollToBottom();
            break;
        }
    }
}

async function reRenderHeader() {
    if (!activeChatId) return;
    for (let i = 0; i < conversations.length; i++) {
        const conversation = conversations[i];
        if (conversation.id == activeChatId) {
            const res = await fetch("/getdp/" + activeChatId)
            const data = await res.json()
            if(data && data.dp){
                picElem.innerHTML = data.dp;
            } 
            nameElem.innerHTML = conversation.name || conversation.id;
            setOnlineStatus()
            return;
        }
    }
}

function changeChat(conversation) {
    headerNumber.innerHTML = `Number: ${conversation.id}`;
    const activeChat = document.querySelectorAll('.conversation.active');
    activeChat.forEach(chat => {
        chat.classList.remove('active');
    })
    conversation.classList.add('active');
    activeChatId = conversation.dataset.chatId;
    sideBar.style.display = "none";
    openConversation.style.display = "flex";
    for (let i = 0; i < conversations.length; i++) {
        const conversation = conversations[i];
        if (conversation.id == activeChatId) {
            conversation.read = true;
            headerNumber.innerHTML = `Number: ${conversation.id}`;
            talkingToEmit(activeChatId, conversation.name);
            bluetickEmit();
            break;
        }
    }
    setConversations(conversations);
    reRenderConversationsList();
    reRenderHeader();
    reRenderChats();
}
function addChangeChatFunction() {
    let conversationBlocks = document.querySelectorAll('.conversation')
    conversationBlocks.forEach(conversation => {
        conversation.removeEventListener('click', () => {
            changeChat(conversation);
        })
        conversation.addEventListener('click', () => {
            changeChat(conversation);
        })
    })
}

function deselectConversation() {
    document.querySelector('#sidebar').style.display = "flex";
    activeChatId = '';
    openConversation.style.display = "none";
    const activeChat = document.querySelectorAll('.conversation.active');
    activeChat.forEach(chat => {
        chat.classList.remove('active');
    })
}

const tx = document.getElementsByTagName("textarea");
for (let i = 0; i < tx.length; i++) {
  tx[i].setAttribute("style", "overflow-y:hidden;");
  tx[i].addEventListener("input", OnInput, false);
}
function updateTyping(sender, text) {
    if (sender != activeChatId) return;
    statusElem.innerHTML = "Typing..."
    let ghostElem = document.getElementById('ghost');
    if (ghostElem) {
        ghostElem.innerHTML = `<div class="messagetext">${text}</div>`;
    } else {
        chatElem.innerHTML = 
            `<div class="message left" id="ghost">
                <div class="messagetext">${text}</div>
            </div>` + chatElem.innerHTML;
    }
}

function updateStopTyping(sender) {
    if(sender != activeChatId) return;
    document.getElementById('#ghost')?.remove();
    setOnlineStatus();
}

function OnInput() {
    if(this.scrollHeight < 250) {
        this.style.height = "auto";
        this.style.height = (this.scrollHeight) + "px";
    }
    if (!this.value.trim()) return;
    if (activeChatId) {
        sendTypingEmit(activeChatId, this.value);
        stopTypingDebounce(activeChatId)
    }
}
const stopTypingDebounce = debounce((activeChatId) => {
    sendStopTypingEmit(activeChatId);
}, 2000)

function debounce(cb, delay = 1000){
    let timeout
    return (...args) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
            cb(...args)
        }, delay);
    }
}

window.onbeforeunload = () => {
    if(activeChatId) setConversations(conversations)
}
document.getElementsByTagName("body")[0].onunload = () => {
    if(activeChatId) setConversations(conversations)
}

function scrollToBottom(){
    chatElem.scrollTop = chatElem.scrollHeight;
}
let loadTimeout;
chatElem.addEventListener('scroll', () => {
    if(Math.abs((chatElem.offsetHeight - chatElem.scrollHeight)-chatElem.scrollTop) < 1) {
        clearTimeout(loadTimeout)
        loadTimeout = setTimeout(() => {
            loadPreviousMessages()
        }, 600);
    }
})