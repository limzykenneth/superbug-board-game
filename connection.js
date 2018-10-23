var _ = require("lodash");

module.exports = function(io){
	// Board socket logic
	var boardConnected = false;
	var board = io
		.of("/board")
		.on("connection", function(socket){
			var connectionID = socket.id;
			console.log("Board connected:", connectionID);
			boardConnected = true;

			socket.on("invalid placement", function(data){
				console.log("invalid placement", data.target);
				client.connected[connectedClients[data.target]].emit("action rejected");
			});

			socket.on("invalid remove location", function(data){
				console.log("invalid remove location", data.target);
				client.connected[connectedClients[data.target]].emit("action rejected");
			});

			socket.on("action accepted", function(data){
				client.connected[connectedClients[data.target]].emit("action accepted");
			});

			// Disconnected from board, pause connected clients
			socket.on("disconnect", function(){
				console.log("Board disconnected:", connectionID);
				boardConnected = false;
			});
		});


	// Client socket logic
	var connectedClients = {
		p1: "",
		p2: ""
	};
	var queuedClients = [];
	var client = io
		.of("/client")
		.on("connection", function(socket){
			console.log("Client connected");

			if(connectedClients.p1 === ""){
				connectedClients.p1 = socket.id;
				socket.emit("assignment", {
					player: "p1"
				});
			}else if(connectedClients.p2 === ""){
				connectedClients.p2 = socket.id;
				socket.emit("assignment", {
					player: "p2"
				});

				board.emit("players ready", "p1");
				board.emit("message", "Bacteria's turn");
				client.connected[connectedClients.p1].emit("turn begin");
			}else{
				queuedClients.push(socket.id);
				socket.emit("queue", {
					msg: "Please wait for your turn"
				});
			}

			socket.on("disconnect", function(){
				// Check if user is one of queued clients
				// if so nothing needs to be done but remove from queue list
				if(_.includes(queuedClients, socket.id)){
					_.remove(queuedClients, function(el){
						return el === socket.id;
					});

				// If user is currently playing, disconnect both players and
				// reset the game
				}else if(connectedClients.p1 === socket.id){
					connectedClients.p1 = "";
					board.emit("player disconnected", {
						target: "p1"
					});
					if(connectedClients.p2 != ""){
						client.connected[connectedClients.p2].emit("opponent disconnected");
						client.connected[connectedClients.p2].disconnect(true);
					}
				}else if(connectedClients.p2 === socket.id){
					connectedClients.p2 = "";
					board.emit("player disconnected", {
						target: "p2"
					});
					if(connectedClients.p1 != ""){
						client.connected[connectedClients.p1].emit("opponent disconnected");
						client.connected[connectedClients.p1].disconnect(true);
					}
				}

				console.log("Client disconnected:", socket.id);
			});

			socket.on("move", function(data){
				board.emit("move", {
					target: data.target,
					direction: data.direction
				});
			});

			socket.on("place", function(data){
				board.emit("place", {
					target: data.target,
					state: data.state
				});
			});

			socket.on("remove", function(data){
				board.emit("remove", {
					target: data.target
				});
			});

			socket.on("turn finished", function(data){
				if(data.target == "p1"){
					board.emit("message", "Human's turn");
					board.emit("turn", "p2");
					client.connected[connectedClients.p2].emit("turn begin");
				}else if(data.target == "p2"){
					board.emit("message", "Bacteria's turn");
					board.emit("turn", "p1");
					client.connected[connectedClients.p1].emit("turn begin");
				}
			});
		});

};