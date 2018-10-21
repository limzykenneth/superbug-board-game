module.exports = function(io){
	// Board socket logic
	var boardConnected = false;
	var board = io
		.of("/board")
		.on("connection", function(socket){
			var connectionID = socket.id;
			console.log("Board connected:", connectionID);
			boardConnected = true;

			socket.emit("move", {
				target: "p1",
				direction: "down"
			});

			socket.emit("place", {
				target: "p1",
				state: "black"
			});

			socket.emit("remove", {
				target: "p1"
			});

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
	var connectedClients = [];
	var client = io
		.of("/client")
		.on("connection", function(socket){
			console.log("Client connected");
		});

};