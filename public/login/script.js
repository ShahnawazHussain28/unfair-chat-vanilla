let loginForm = document.getElementById('loginform');
let idInput = document.getElementById("idinput");
let passwordInput = document.getElementById("passwordinput");
let confirmpasswordInput = document.getElementById("confirmpasswordinput");
let changeFormText = document.getElementById("changeformtext");
let preChangeFormText = document.getElementById("prechangeformtext");
let details = document.getElementById("details")
let overlay = document.getElementById("overlay")
let titletext = document.getElementById("titletext")

const TITLE_TEXT = "Unfair Chat"
const PREFIX_KEY = "unfair-chat-"
if(localStorage.getItem(PREFIX_KEY+"id")){
    window.location.href = "/";
}

document.querySelector("#about").addEventListener('click', () => {
    details.classList.add('active');
    overlay.classList.add("active");
})
overlay.addEventListener('click', () => {
    details.classList.remove('active');
    overlay.classList.remove("active");
})

let login = true;
document.querySelector("label[for=confirmpassword]").style.display = "none";
confirmpasswordInput.style.display = "none";

let alertCloseButton = document.querySelector(".alertclosebutton");
alertCloseButton.addEventListener('click', (e) =>{
    alertCloseButton.closest(".alertbox").style.display = "none";
})
function showAlert(text){
    const alerttext = document.querySelector(".alerttext");
    alerttext.innerHTML = text;
    const alertbox = document.querySelector(".alertbox");
    alertbox.style.display = "flex";
}
function hideAlert(){
    const alertbox = document.querySelector(".alertbox");
    alertbox.style.display = "none";
}

loginForm.addEventListener('submit', onFormSubmit);
changeFormText.addEventListener('click', changeForm);

function onFormSubmit(e){
    e.preventDefault();
    if(login) tryLogin();
    else trySignup();
}

async function tryLogin(){
    const user = {
        id: idInput.value, 
        password: passwordInput.value, 
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
        localStorage.setItem(PREFIX_KEY+"id", idInput.value);
        localStorage.setItem(PREFIX_KEY+"dp", data.dp);
        window.location.href = "/";
    } else {
        showAlert(data.message);
    }
}
async function trySignup(){
    if(passwordInput.value != ''){
        if(passwordInput.value == confirmpasswordInput.value){
            const user = {
                id: idInput.value, 
                password: passwordInput.value, 
                confirmPassword: confirmpasswordInput.value
            }
            const options = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"   
                },
                body: JSON.stringify(user)
            }
            const res = await fetch("/register", options)
            const data = await res.json()
            if (data.granted) {
                changeForm()
                showAlert("Account successfully Created. Please Log In")
            } else {
                showAlert(data.message)
            }
            
        } else {
            showAlert("Passwords do not Match");
        }
    } else {
        showAlert("Please provide all the Fields");
    }
}

function changeForm(e){
    hideAlert();
    loginForm.reset();
    let submitBtn = document.querySelector("[type=submit]");
    if (login == true) login = false;
    else login = true;
    if(login==true){
        document.querySelector("label[for=confirmpassword]").style.display = "none";
        confirmpasswordInput.style.display = "none";
        submitBtn.value = "Login";
        changeFormText.innerHTML = "Sign Up";
        preChangeFormText.innerHTML = "Need an Account? &nbsp;&nbsp;"
        document.querySelector('h2').innerHTML = "Login";
    } else {
        document.querySelector("label[for=confirmpassword]").style.display = "block";
        confirmpasswordInput.style.display = "block";
        submitBtn.value = "Sign Up";
        changeFormText.innerHTML = "Login";
        preChangeFormText.innerHTML = "Already have an Account? &nbsp;&nbsp;"
        document.querySelector('h2').innerHTML = "Sign Up";
    }
}

function typingEffect(){
    if(titletext.innerHTML == TITLE_TEXT){
        clearTimeout(timeout)
        return;
    }
    let timeout = setTimeout(() => {
        titletext.innerHTML += TITLE_TEXT[titletext.innerHTML.length]
        typingEffect()
    }, 800);
}
typingEffect()