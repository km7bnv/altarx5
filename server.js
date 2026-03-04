const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("."));
app.use(bodyParser.json());

/* ======================
   ADMIN SETTINGS
====================== */

const ADMIN_PASSWORD = "12345678";
let maintenanceMode = false;
let adminLoggedIn = false;

/* ======================
   MAINTENANCE MIDDLEWARE
====================== */

app.use((req, res, next) => {

  if (!maintenanceMode) return next();

  // allow admin routes
  if (req.path.startsWith("/admin")) return next();

  res.send(`
  <html>
  <head>
  <title>Maintenance</title>
  <style>
  body{
  background:#0f172a;
  color:white;
  font-family:Arial;
  display:flex;
  justify-content:center;
  align-items:center;
  height:100vh;
  }
  </style>
  </head>

  <body>
  <h1>🚧 Site Under Maintenance</h1>
  </body>
  </html>
  `);

});

/* ======================
   ADMIN LOGIN PAGE
====================== */

app.get("/admin",(req,res)=>{

res.send(`

<html>
<head>

<title>Admin Login</title>

<style>

body{
background:#0f172a;
color:white;
font-family:Arial;
display:flex;
justify-content:center;
align-items:center;
height:100vh;
}

.box{
background:#1e293b;
padding:30px;
border-radius:12px;
text-align:center;
}

input{
padding:10px;
margin-top:10px;
width:200px;
}

button{
padding:10px;
margin-top:10px;
width:100%;
cursor:pointer;
}

</style>

</head>

<body>

<div class="box">

<h2>Admin Login</h2>

<input type="password" id="pass" placeholder="Password">

<br>

<button onclick="login()">Login</button>

</div>

<script>

function login(){

const pass = document.getElementById("pass").value;

fetch("/admin/login",{
method:"POST",
headers:{ "Content-Type":"application/json"},
body:JSON.stringify({password:pass})
})
.then(r=>r.json())
.then(data=>{
if(data.success){
window.location="/admin/panel"
}else{
alert("Wrong password")
}
})

}

</script>

</body>
</html>

`);

});

/* ======================
   ADMIN LOGIN CHECK
====================== */

app.post("/admin/login",(req,res)=>{

const {password} = req.body;

if(password === ADMIN_PASSWORD){
adminLoggedIn = true;
res.json({success:true});
}else{
res.json({success:false});
}

});

/* ======================
   ADMIN PANEL
====================== */

app.get("/admin/panel",(req,res)=>{

if(!adminLoggedIn){
return res.redirect("/admin");
}

res.send(`

<html>

<head>

<title>Admin Panel</title>

<style>

body{
background:#0f172a;
color:white;
font-family:Arial;
display:flex;
justify-content:center;
align-items:center;
height:100vh;
}

.box{
background:#1e293b;
padding:40px;
border-radius:12px;
text-align:center;
}

button{
padding:14px;
font-size:18px;
cursor:pointer;
margin-top:15px;
}

</style>

</head>

<body>

<div class="box">

<h2>Admin Control</h2>

<p>Maintenance Mode: <b>${maintenanceMode}</b></p>

<button onclick="toggle()">Toggle Maintenance</button>

</div>

<script>

function toggle(){

fetch("/admin/toggle")
.then(r=>r.json())
.then(data=>{
location.reload();
})

}

</script>

</body>
</html>

`);

});

/* ======================
   TOGGLE MAINTENANCE
====================== */

app.get("/admin/toggle",(req,res)=>{

if(!adminLoggedIn){
return res.send("Unauthorized");
}

maintenanceMode = !maintenanceMode;

res.json({status: maintenanceMode});

});

/* ======================
   CHAT ROOMS
====================== */

const rooms = {};

function generateRoomCode() {

let code;

do{
code = Math.floor(100000 + Math.random()*900000).toString();
}while(rooms[code]);

return code;

}

/* ======================
   SOCKET.IO
====================== */

io.on("connection", (socket) => {

let currentRoom = null;

socket.on("createRoom",(name,callback)=>{

const code = generateRoomCode();

rooms[code] = {
users:[{id:socket.id,name}],
messages:[]
};

socket.join(code);

currentRoom = code;

callback(code);

});

socket.on("joinRoom",({code,name},callback)=>{

const room = rooms[code];

if(!room)
return callback({success:false,message:"Room not found"});

if(room.users.length >= 3)
return callback({success:false,message:"Room full"});

room.users.push({id:socket.id,name});

socket.join(code);

currentRoom = code;

callback({success:true});

const last50 = room.messages.slice(-50);

socket.emit("loadMessages",last50);

io.to(code).emit("systemMessage",name+" joined room "+code);

});

socket.on("sendMessage",({code,name,message})=>{

const room = rooms[code];

if(!room) return;

const msg = {
name,
message,
time:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})
};

room.messages.push(msg);

io.to(code).emit("newMessage",msg);

});

socket.on("disconnecting",()=>{

if(currentRoom && rooms[currentRoom]){

rooms[currentRoom].users =
rooms[currentRoom].users.filter(u=>u.id !== socket.id);

if(rooms[currentRoom].users.length === 0)
delete rooms[currentRoom];

}

});

});

/* ======================
   START SERVER
====================== */

const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
console.log("Server running on port",PORT);
});