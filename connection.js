module.exports = function(io){

	io.on("connection", function(socket){
		console.log("A user connected");

		socket.on("my event", function(data){
			console.log(data);
		});
	});

};