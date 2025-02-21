// Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-app.js";
import * as rtdb from "https://www.gstatic.com/firebasejs/9.0.2/firebase-database.js";
import * as fbauth from "https://www.gstatic.com/firebasejs/9.0.2/firebase-auth.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyBFCS1tp8tpRZneIOWbCwB76BschzjN-Zo",
    authDomain: "mini-cord.firebaseapp.com",
    projectId: "mini-cord",
    storageBucket: "mini-cord.appspot.com",
    messagingSenderId: "62099491016",
    appId: "1:62099491016:web:9645dbcfabade13587bdfd"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
let db = rtdb.getDatabase(app);
let auth = fbauth.getAuth(app);
let titleRef = rtdb.ref(db, "/");
let servers = rtdb.child(titleRef,"servers()");
let username = "guest";//window.prompt("Please enter name");
let server = "";
let channel = "";
let chat = "";
let serverRef = "";
let channelRef = "";
let chatRef = "";
let usersRef = "";
let ignore = false;
let serverCount = 0;
let channelCount = 0;
let messageCount = 0;
let userCount = 0;
let changedServers = false;
var pages = ["loginScreen","registerScreen","mainScreen"];
var pageIndex = 0;
let signedEmail = "";
let ignoreUsers = false;
let uid = "";
let messageLock = false;


var showNextPage = function(){
  var template = document.getElementById(pages[pageIndex]).innerHTML;
  //do stuff to template here
  display.innerHTML = template;
}


showNextPage();


$(document).on('click', '.switcher', function() {
  console.log("clicked!");
  console.log($(this).attr("id"));
  if($(this).attr("id") === "haveAccount") {
    pageIndex = 0;
  }
  else {
    pageIndex = (pageIndex + 1) % 3;
  }
  showNextPage();
});


$(document).on('click', '#registerButton', function() {
  let validAccount = true;
  let email = $("#emailRegister").val();
  let usernameRegistered = $("#usernameRegister").val();
  let listOfUsers = rtdb.child(titleRef,"users");
  rtdb.get(listOfUsers).then(usernames =>{
    usernames.forEach(function(item){
      if(item.val().username === usernameRegistered) {
        alert("username is already in use");
        validAccount = false;
      }
    });
    let p1 = $("#passwordRegister").val();
    let p2 = $("#passwordConfirm").val();
    if (p1 != p2){
      alert("Passwords don't match");
      validAccount = false;
    }
    if(validAccount) {
      fbauth.createUserWithEmailAndPassword(auth, email, p1).then(somedata=>{
        uid = somedata.user.uid;
        let userRoleRef = rtdb.ref(db, `/users/${uid}/roles/user`);
        let userRef = rtdb.ref(db, `/users/${uid}/username`);
        rtdb.set(userRoleRef, true);
        rtdb.set(userRef, usernameRegistered);
        alert("successfully signed up!");
        username = usernameRegistered;
        $("#showUsername").text(`Logged in as: ${username}`);
        signedEmail = email;
        pageIndex += 1;
        assembleRefs();
        getServers();
        showNextPage();
      }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage);
        alert("something went wrong! Make sure you are using a valid email")
      });
    }
  });
});


$(document).on('click', '#loginButton', function() {
  let email = $("#emailLogin").val();
  let pwd = $("#passwordLogin").val();
  fbauth.signInWithEmailAndPassword(auth, email, pwd).then(
    somedata=>{
      uid = somedata.user.uid;
      pageIndex = 2;
      signedEmail = email;
      let userRef = rtdb.ref(db, `/users/${uid}/username`);
      rtdb.get(userRef).then(ss => {
        username = ss.val();
        console.log(username);
        $("#showUsername").text(`Logged in as: ${username}`);
        assembleRefs();
        getServers();
        showNextPage();
      });
    }).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(errorCode);
      console.log(errorMessage);
      alert("Wrong email or password");
    });
});


$(document).on('click', '.messageChoice', function() {
  var msgId = $(this).attr("id");
  var messageRef = rtdb.child(channelRef,"messages");
  messageRef = rtdb.child(messageRef,msgId);
  let accRef = rtdb.child(serverRef,"users");
  accRef = rtdb.child(accRef,uid);
  accRef = rtdb.child(accRef,"role");
  rtdb.get(messageRef).then(ss=>{ //prevents message refresh every time something changes that's not relevant to messages
    let newText = prompt("Modify your message, to delete enter a blank field",ss.val().message);
    if(newText == null) {
      return;
    }
    rtdb.get(accRef).then(accPermissions => {
      rtdb.get(messageRef).then(msgAuthor => {
        if(accPermissions.val() !== "admin" && msgAuthor.val().userUid !== uid) {
          alert("Only server admins and the author of the message can edit messages");
        }
        if(newText !== "") {
          let newMessage = {"message":newText};
          rtdb.update(messageRef,newMessage);
        }
        else{
          rtdb.remove(messageRef);
        }
      });
    })
      
    //getMessages();
  });
});


$(document).on('click','.user',function(){
  let userUid = $(this).attr("id");
  let isPromoted = confirm(`Promote User?`);
  if(isPromoted) {
    let uidRef = rtdb.child(usersRef,userUid);
    let newRole = {"role": "admin"};
    rtdb.update(uidRef,newRole);
  }
  let accRef = rtdb.child(serverRef,"users");
  accRef = rtdb.child(accRef,uid);
  accRef = rtdb.child(accRef,"role");
  rtdb.get(accRef).then(accPermissions => {
    if(accPermissions.val() !== "admin") {
      alert("Only server admins can promote users to admin");
    }
    if(userUid == uid) {
      alert("Cannot promote yourself lol");
    }
  })
});


getServers();
$( document ).ready(function() {
  console.log( "ready!" );
  //$("#login").keyup(keyHandler);
});


let keyHandler = function(evt) {
  if (evt.keyCode === 13) {
    //username = $("#login").val();
    $("#showUsername").text(`Logged in as: ${username}`);
  }
  //let idFromDOM = $(clickedElement).attr("data-id");
  //alert(idFromDOM);
}


$(document).on('click','#superButton',function(){
  fbauth.signOut(auth);
});


$(document).on('click', '.adder', function() {
  ignore = true;
  let newVal = window.prompt("Please enter name");
  if(newVal != null && newVal.length > 0) {
    newVal = newVal.replace(/\s+/g, '-');
    newVal = newVal.replace(/[^a-zA-Z0-9-]/g, '');
    let adderId = $(this).attr('id');
    if(adderId == "addServer") {
      let info = {"serverName": newVal,"creator": username};
      let generalChat = {"channelName": "general", "creator": username};
      let newServer = rtdb.child(servers,newVal);
      let textChat = rtdb.child(newServer,"chats");
      let gChat = rtdb.child(textChat,"general");
      let chat = rtdb.child(gChat,"messages");
      let newChannel = {"message": "first message!", "user": username, "userUid":uid};
      let users = rtdb.child(newServer,"users");
      let firstUser = rtdb.child(users,uid);
      let userInfo = {"role":"admin","username":username};
      rtdb.update(firstUser,userInfo);
      ignore = true;
      rtdb.push(chat, newChannel);
      ignore = true;
      rtdb.update(newServer,info);
      ignore = true;
      rtdb.update(gChat,generalChat);
      getServers();
    }
    else if(adderId == "addChannel") {
      let accRef = rtdb.child(serverRef,"users");
      accRef = rtdb.child(accRef,uid);
      accRef = rtdb.child(accRef,"role");
      rtdb.get(accRef).then(accPermissions => {
        if(accPermissions.val() !== "admin") {
          alert("Only server admins can add channels");
        }
      })
      let info = {"serverName": server,"creator": username};
      let generalChat = {"channelName": newVal, "creator": username};
      let newServer = rtdb.child(servers,server);
      let textChat = rtdb.child(newServer,"chats");
      let gChat = rtdb.child(textChat,newVal);
      let chat = rtdb.child(gChat,"messages");
      let newChannel = {"message": "first message!", "user": username, "userUid":uid};
      rtdb.push(chat, newChannel);
      rtdb.update(gChat,generalChat);
    }
  }
});


$(document).on('click','.remover',function(){
  let id = $(this).attr("id");
  let deletedObject = null; 
  let objectName = null;
  let objectType = null;
  let accRef = rtdb.child(serverRef,"users");
  accRef = rtdb.child(accRef,uid);
  accRef = rtdb.child(accRef,"role");
  rtdb.get(accRef).then(accPermissions => {
    if(accPermissions.val() !== "admin") {
      alert("Only server admins can remove servers and channels");
    }
  })
  if(id === "removeServer") {
    if(server.length < 1) {
      alert("please select a server to remove");
      return;
    }
    deletedObject = serverRef;
    objectName = server;
    objectType = "server";
  }
  else {
    if(channel.length < 1) {
      alert("please select a channel to remove");
      return;
    }
    deletedObject = channelRef;
    objectName = channel;
    objectType = "channel";
  }
  let isDelete = confirm(`Remove ${objectType} ${objectName}?`);
  if(isDelete) {
    rtdb.remove(deletedObject);
  }
});


rtdb.onChildChanged(servers,ss=>{

  console.log("child change");
  $("#messagesList").empty();
  getMessages();
})


rtdb.onValue(servers, ss=>{
  if(server.length == 0) {
    ignore = false;
    return;
  }
  if(!ignore) {
    assembleRefs();
    getServers();
    getChannels();
    //addUserIfNeeded(); don't need to add twice, causes duplicate user list
    getUsers();
    if(channelRef.length == 0) {
      ignore = false;
      return;
    }
    rtdb.get(channelRef).then(ss=>{ //prevents message refresh every time something changes that's not relevant to messages
      if(ss.val() !== null) {
        if(messageCount < Object.keys(ss.val().messages).length) {
          messageCount = Object.keys(ss.val().messages).length;
          $("#messagesList").empty();
          getMessages();
          console.log("msg refresh");
        }
      }
      
      
    });
    //getMessages();
  }
  ignore = false;
});


$(document).on('click', '.serverChoice', function() {
  ignoreUsers = true;
  $("#messagesList").empty();
  //$("#enterChat").hide();
  //$("#enterChat").html("hello");
  $("usersList").empty();
  $("adminsList").empty();
  changedServers = true;
  highlightServers($(this).attr('id'));
  channel = "";
  server = $(this).attr('id');
  
  assembleRefs();
  getChannels();
  addUserIfNeeded();
  console.log("gotusers");
  if(channel.length == 0) {
    return;
  }
  getMessages();
  rtdb.get(serverRef).then(ss=>{
    channelCount = Object.keys(ss.val().chats).length;
  });
  rtdb.get(channelRef).then(ss=>{
    messageCount = Object.keys(ss.val().messages).length;
  });
  rtdb.get(serverRef).then(ss=>{
    userCount = Object.keys(ss.val().users).length;
  });
});


function highlightServers(id) {
  if(!changedServers) {
    $(`#${id}`).css("background-color","#B6D0E2");
  }
  else {
    changedServers = false;
    if(server.length > 0){
      console.log("changing");
      $("#" + server).css("background-color","#F6D1D9");
    }
    $(`#${id}`).css("background-color","#B6D0E2");
  }
}


$(document).on('click', '.channelChoice', function() {
  if(channel.length > 0) {
    $("#" + channel + ".channelChoice").css("background-color","#C3B1E1");
  }
  channel = $(this).attr('id');
  assembleRefs();
  getMessages();
  rtdb.get(channelRef).then(ss=>{
    messageCount = Object.keys(ss.val().messages).length;
    console.log(messageCount);
  });
  rtdb.get(serverRef).then(ss=>{
    userCount = Object.keys(ss.val().users).length;
  });
  $(this).css("background-color","#B6D0E2");
});


function addUserIfNeeded() {
  rtdb.get(usersRef).then(ss=>{
    if(ss.val().hasOwnProperty(uid)) { //if exists need to get users
      console.log("getting!");
      console.log("exists!");
      getUsers();
    }
    else {
      let firstUser = rtdb.child(usersRef,uid);
      let userInfo = {"role":"user","username":username};
      rtdb.update(firstUser,userInfo);
    }
  });
}


function getUsers() {
  $("#usersList").empty();
  $("#adminsList").empty();
  rtdb.get(usersRef).then(ss=>{
    ss.forEach(function(item){
      let usersInput = JSON.stringify(item.val().username);
      if(typeof(usersInput) != "undefined"){
        var strWithOutQuotes= usersInput.replace(/"/g, '');
        if(item.val().role === "admin") {
          $("#adminsList").append('<li class="user" id = "' + item.key + '"><p>' + strWithOutQuotes +'</p></li>');
        }
        else {
          $("#usersList").append('<li class="user" id = "' + item.key + '"><p>' + strWithOutQuotes +'</p></li>');
        }
      }
    });
  });
}


function getMessages() {
  if(messageLock == false) {
    messageLock = true;
    $("#messagesList").empty();
    rtdb.get(chatRef).then(ss=>{
      ss.forEach(function(item){
        //console.log(`id: ${item.key}`);
        let idVal = item.key;
        let channelsInput = JSON.stringify(item.val().message);
        let userStamp = item.val().user;
        if(typeof(channelsInput) != "undefined"){
          var strWithOutQuotes= channelsInput.replace(/"/g, '');
          $("#messagesList").append('<li class="messageChoice" id = "' + idVal + '"><h4>' + item.val().user + "</h4><p>" + strWithOutQuotes +'</p></li>');
          //$(`#${idVal}`).click(getMessageInfo);
        }
      });
      messageLock = false;
    });
  }
}


function getChannels() {
  $("#channelsList").empty();
  serverRef = rtdb.child(servers,server);
  let chatsHolder = rtdb.child(serverRef,"chats");
  rtdb.get(chatsHolder).then(ss=>{
    ss.forEach(function(item){
      let channelsInput = JSON.stringify(item.val().channelName);
      if(typeof(channelsInput) != "undefined"){
        var strWithOutQuotes= channelsInput.replace(/"/g, '');
        strWithOutQuotes = strWithOutQuotes.replace(/\s+/g, '-');
        $("#channelsList").append('<li class="channelChoice" id = "' + strWithOutQuotes + '"><p>' + strWithOutQuotes +'</p></li>');
        if(strWithOutQuotes == channel) {
          var channelId = "#" + channel;
          $(channelId).css("background-color","#B6D0E2");
        }
      }
    });
  });
}


function getServers() {
  $("#servers").empty();
  rtdb.get(servers).then(ss=>{
    ss.forEach(function(item){
      let channelsInput = JSON.stringify(item.val().serverName);
      if(typeof(channelsInput) != "undefined"){
        var strWithOutQuotes= channelsInput.replace(/"/g, '');
        strWithOutQuotes = strWithOutQuotes.replace(/\s+/g, '-');
        $("#servers").append('<div class="serverChoice" id = "' + strWithOutQuotes + '"><p>' + strWithOutQuotes +'</p></div>');
        if(strWithOutQuotes == server) {
          var serverId = "#" + server;
          $(serverId).css("background-color","#B6D0E2");
        }
      }
    });
  });
}


function assembleRefs() {
  if(server.length > 0) {
    serverRef = rtdb.child(servers,server);
    let chatsHolder = rtdb.child(serverRef,"chats");
    usersRef = rtdb.child(serverRef,"users");
    if(channel.length > 0) {
      channelRef = rtdb.child(chatsHolder,channel);
      chatRef = rtdb.child(channelRef,"messages");
    }
  }
}


$(document).on('keyup', '#enterChat', function() {
    if (event.keyCode === 13) {
        submitMessage($("#enterChat").val());
    }
});


function submitMessage(entered) {
  //ignore = true;
  $("#enterChat").val('');
  assembleRefs();
  let msg = {"message": entered, "user": username, "userUid":uid};
  console.log(entered);
  rtdb.push(chatRef, msg);
  //getMessages();
}