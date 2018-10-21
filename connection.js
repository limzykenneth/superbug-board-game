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
			});

			socket.on("invalid remove location", function(data){
				console.log("invalid remove location", data.target);
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

			client.clients(function(err, clients){
				if(err) throw err;

				if(clients.length >= 2){
					// Queue the newly connected client
					queuedClients.push(socket.id);
					socket.emit("queue", {
						msg: "Please wait for your turn"
					});
				}else{
					// Assign player role to connected client
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

						socket.emit("players assigned");
					}
				}
			});

			socket.on("disconnect", function(){
				// Check if user is one of queued clients
				if(_.includes(queuedClients, socket.id)){
					_.remove(queuedClients, function(el){
						return el === socket.id;
					});
				}else if(connectedClients.p1 === socket.id){
					connectedClients.p1 = "";
					socket.emit("player disconnected", {
						target: "p1"
					});
				}else if(connectedClients.p2 === socket.id){
					connectedClients.p2 = "";
					socket.emit("player disconnected", {
						target: "p2"
					});
				}
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
		});

};