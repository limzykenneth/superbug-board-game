var socket = io("http://localhost:3001");

socket.emit("my event", "hello world");