var SoftdevPlayer = (function() { // namespace (Module pattern)			

	
	var playerId = +(new Date()); //Timestamp
	const URL = 'http://localhost:5000/heist';	

	function getPlay(board, onPlayed) {			
		var oppTurn = OPP_TURN[board.turn];
		
		var moveStr = '';
		if (game.history.length-2 < 0) { //first player, no move history
			console.log('Assuming initial move');
			var pawn = board.pawns[board.turn];
			return onPlayed({type:FLOOR, sr:pawn.r, sc:pawn.c, dr:7, dc:4});
		}
		else {
			var prevBoardStr = game.history[game.history.length-2];
			var bOld = BoardLite_fromString(prevBoardStr);
			var bNew = BoardLite_fromBoard(board);	
			var move = BoardLite_deriveMove(bOld, bNew, oppTurn);
			moveStr = board.omnFromMove(move); 
		}
		
		var url = URL + '?';
		
		var qsStart = (url.lastIndexOf('?') > 0)? '&' : '?'; //Horrible format
		var queryString = qsStart + 'id=' + playerId + '&move=' + moveStr;
		url += queryString;
		
		ajax(url, function(data, status) {
			//Optional argument to log info 
			if (data.hasOwnProperty('alert')) alert(data.alert); 
			if (data.hasOwnProperty('log')) console.log(data.log); 
			if (data.hasOwnProperty('move')) {
								
				//Expect a OMN String - Example: A5B4 
				var omn = data.move;				
				var move = board.omnToMove(omn);
				move.player = PLAYER_SOFTDEV;
				if (move) {					
					return onPlayed(move);							
				}
				else return alert ('Player attempted invalid move');				
				
			}
			else return alert('Expected a JSON object containing "move" attribute.');
		});
		
	}
	
		
	
	//Vanilla J/S equivalent of jQuery's $.ajax
	function ajax(url, callback) { 
		var xhr = new XMLHttpRequest();
		xhr.open('GET', encodeURI(url));
		xhr.onload = function() {
			var data = JSON.parse(xhr.responseText);
			callback(data, xhr.status);			
		};
		xhr.send();
	}
		
	//Exports
	return {getPlay:getPlay};

})(); //End SoftdevPlayer namespace