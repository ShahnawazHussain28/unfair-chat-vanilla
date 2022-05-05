function displayDetailsModal(dp, talkingToId, talkingToName){
    if(!activeChatId) return;
    for (let i = 0; i < conversations.length; i++) {
        const conversation = conversations[i];
        if(conversation.id == activeChatId) {
            if (talkingToId == myId) {
                talkingToName = "You"
                talkingToId = ''
            }
            document.querySelector("#detailsdp").innerHTML = dp
            document.querySelector("#detailsname").innerHTML = conversation.name || '';
            document.querySelector("#detailsnumber").innerHTML = conversation.id;
            document.querySelector("#detailstotalmessage").innerHTML = "Total Messages: "+ conversation.messages.length;
            document.querySelector("#talkingtoid").innerHTML = talkingToId;
            document.querySelector("#talkingtoname").innerHTML = talkingToName || 'Unsaved'
            document.querySelector("#contactdetails").classList.add("active")
            document.querySelector("#overlay").classList.add("active")
            break;
        }
    }
}
function chooseDP(){
    document.querySelector("#choosedp").classList.add("active")
    document.querySelector("#overlay").classList.add("active")
}
async function setDP(elem){
    if(!myId) return;
    const user = {
        id: myId, 
        dp: elem.innerHTML 
    }
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"   
        },
        body: JSON.stringify(user)
    }
    const res = await fetch("/setdp", options)
    const data = await res.json()
    if(data.success) {
        localStorage.setItem(PREFIX_KEY+"dp", elem.innerHTML);
    }
    reRenderConversationsList();
    closeAllModal();
}
function logOut(){
    if(window.confirm("Log Out? All chats will be lost!")){
        localStorage.removeItem(PREFIX_KEY+"id");
        localStorage.removeItem(conversationKey);
        window.location.reload();
    }
}
async function deleteAccount(){
    if(!window.confirm("Delete Account? All chats will be lost! You have to create a new Account"))
        return;
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"   
        },
        body: JSON.stringify({id: myId})
    }
    const res = await fetch("/deleteAccount")
    const data = await res.json()
    if(data.success == true){
        logOut();
        window.alert(data.message)
        window.location.reload()
    } else {
        window.alert(data.message)
    }
}

function saveContact(){
    let name = document.querySelector("#saveName").value.trim();
    if(!name) return;
    let currentConversation = conversations.filter(conv => conv.id == activeChatId);
    if(currentConversation.length > 0){
        currentConversation[0].name = name;
    }
    setConversations(conversations)
    reRenderHeader();
    reRenderConversationsList();
    closeAllModal();
}

function clearChat(){
    if(!window.confirm("Are you sure? All messages of this chat will be lost!")) return;
    let foundConversation = conversations.filter(conv => conv.id == activeChatId)
    if (foundConversation.length > 0) {
        foundConversation[0].messages = [];
        reRenderChats();
        closeAllModal();
    }
    setConversations(conversations);
}

function deleteContact(){
    if(!window.confirm("Are you sure? Number will be deleted and chats will be Lost")) return;
    let foundConversation = conversations.filter(conv => conv.id == activeChatId)
    if (foundConversation.length > 0) {
        deselectConversation()
        let index = conversations.indexOf(foundConversation[0]);
        conversations.splice(index, 1);
        activeChatId = '';
        reRenderConversationsList();
        closeAllModal();
    }
    setConversations(conversations);
}

async function checkCredentials(id, pass){
    const user = {
        id: id, 
        password: pass, 
    }
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"   
        },
        body: JSON.stringify(user)
    }
    const res = await fetch("/login", options)
    const data = await res.json()
    if (data.granted) {
        return true;
    } else {
        return false;
    }
}