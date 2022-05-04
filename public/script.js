let activeChatId = ''
let myId = '7439558390'
const PREFIX_KEY = "unfair-chat-"
const conversationKey = PREFIX_KEY + "conversations"
const createContactForm = document.querySelector("#createcontactform")
let conversations = JSON.parse(localStorage.getItem(conversationKey))
let chatElem = document.querySelector("#chat");
let openConversation = document.querySelector("#openconversation")
let msg = document.querySelector('#msg')

const chatboxForm = document.querySelector("#chatbox")

if (!localStorage.getItem(PREFIX_KEY + "id")) window.location.href = "/login";

reRenderConversationsList();
openConversation.style.display = "none";

document.onfullscreenchange = (e) => {
    if(!document.fullscreenElement) {
        document.querySelector("#fullscreen").firstChild.className = "fa fa-expand";
    } else {
        document.querySelector("#fullscreen").firstChild.className = "fa fa-compress";
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
        if (idFound == true) {
            reRenderConversationsList();
            document.querySelector(`[data-chat-id = '${id}']`).querySelector(".unread").classList.add("active");
        } else {
            reRenderConversationsList();
            document.querySelector(`[data-chat-id = '${id}']`).querySelector(".unread").classList.add("active");
        }
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
    if (!conversations) return;
    document.querySelector("#mydp").innerHTML = localStorage.getItem(PREFIX_KEY+"dp") || '😒';
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
    const res = await fetch("/onlineStatus/" + activeChatId)
    const data = await res.json()
    if (data && data.status) {
        for (let i = 0; i < conversations.length; i++) {
            const conversation = conversations[i];
            if (conversation.id === activeChatId) {
                let status = data.status
                if (status === 'online') conversation.status = 'Online'
                else {
                    var options = { hour: "2-digit", minute: "2-digit" }
                    const d = new Date(status)
                    const date = d.toLocaleDateString(options)
                    const today = new Date();
                    if (today.toLocaleDateString(options) === date) {
                        const time = d.toLocaleTimeString("en-us", options)
                        conversation.status = "Last seen: " + time
                    } else {
                        const time = d.toLocaleTimeString("en-us", options)
                        conversation.status = date + " " + time
                    }
                }
                document.querySelector("#status").innerHTML = conversation.status;
                setConversations(conversations);
                return;
            }
        }
    } else {
        for (let i = 0; i < conversations.length; i++) {
            const conversation = conversations[i];
            if (conversation.id === activeChatId) {
                conversation.status = '';
                document.querySelector("#status").innerHTML = conversation.status;
                setConversations(conversations);
                return;
            }
        }
    }
}

function updateOnlineStatus(id, online){
    if (!conversations) return;
    for (let i = 0; i < conversations.length; i++) {
        const conversation = conversations[i];
        if (conversation.id == id) {
            if (online) {
                conversation.status = "online";
            } else {
                var options = { hour: "2-digit", minute: "2-digit" }
                let d = new Date()
                const time = d.toLocaleTimeString("en-us", options)
                conversation.status = 'Last seen: '+ time;
            }
            setConversations(conversations);
            reRenderHeader();
            break;
        }
    }
}

function addMessageToChat(message) {
    const chatContainer = document.querySelector("#chat")
    blueTickElem = message.fromMe ? `<span class="bluetick ${message.seen ? 'blue' : ''}">&#10003;</span>` : "";
    chatContainer.innerHTML =
        `<div class='message ${message.fromMe ? 'right' : 'left'}'>
        <div class="messagetext">${message.text}</div>
        <span class="metadatacontainer">
            ${blueTickElem}
            <span class="time">${message.time}</span>
        </span>
    </div>` + chatContainer.innerHTML;
}

function reRenderChats() {
    const chatContainer = document.querySelector("#chat");
    chatContainer.innerHTML = "";
    for (let i = 0; i < conversations.length; i++) {
        const conversation = conversations[i];
        if (conversation.id == activeChatId) {
            for (let j = 0; j < conversation.messages.length; j++) {
                const message = conversation.messages[j];
                blueTickElem = message.fromMe ? `<span class="bluetick ${message.seen ? 'blue' : ''}">&#10003;</span>` : "";
                chatContainer.innerHTML +=
                    `<div class='message ${message.fromMe ? 'right' : 'left'}'>
                        <div class="messagetext">${message.text}</div>
                        <span class="metadatacontainer">
                            ${blueTickElem}
                            <span class="time">${message.time}</span>
                        </span>
                    </div>`
            }
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
                document.querySelector("#pic").innerHTML = data.dp;
            } 
            document.querySelector("#name").innerHTML = conversation.name || conversation.id;
            document.querySelector("#status").innerHTML = conversation.status;
        }
    }
}

function changeChat(conversation) {
    document.querySelector("#headerNumber").innerHTML = `Number: ${conversation.id}`;
    const activeChat = document.querySelectorAll('.conversation.active');
    activeChat.forEach(chat => {
        chat.classList.remove('active');
    })
    conversation.classList.add('active');
    activeChatId = conversation.dataset.chatId;
    document.querySelector('#sidebar').style.display = "none";
    openConversation.style.display = "flex";
    for (let i = 0; i < conversations.length; i++) {
        const conversation = conversations[i];
        if (conversation.id == activeChatId) {
            conversation.read = true;
            document.querySelector("#headerNumber").innerHTML = `Number: ${conversation.id}`;
            bluetickEmit();
            break;
        }
    }
    setConversations(conversations);
    setOnlineStatus();
    reRenderConversationsList();
    reRenderHeader();
    reRenderChats();
}
function addChangeChatFunction() {
    let conversationBlocks = document.querySelectorAll('.conversation')
    conversationBlocks.forEach(conversation => {
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
//   tx[i].setAttribute("style", "height:" + (tx[i].scrollHeight) + "px;overflow-y:hidden;");
  tx[i].setAttribute("style", "overflow-y:hidden;");
  tx[i].addEventListener("input", OnInput, false);
}
function updateTyping(sender, text) {
    if (sender != activeChatId) return;
    document.querySelector('#status').innerHTML = "Typing..."
    const chatElem = document.querySelector('#chat');
    let ghostElem = document.querySelector('#ghost');
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
    document.querySelector('#ghost')?.remove();
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