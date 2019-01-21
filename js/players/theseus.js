var TheseusPlayer = (function() { //Picket namespace (Module pattern)			

	
	var playerId = +(new Date()); //Timestamp
	
	function getPlay(board, onPlayed) {			
		var turn = board.turn;
		
		var url = 'https://schneiderbox.net/theseus';				
		
		var qsStart = (url.lastIndexOf('?') > 0)? '&' : '?'; //Horrible format
		var queryString = qsStart + 'id=' + playerId + '&' + board.toString();
		url += queryString;
		
		ajax(url, function(data, status) {
			//Optional argument to log info 
			if (data.hasOwnProperty('alert')) alert(data.alert); 
			if (data.hasOwnProperty('log')) console.log(data.log); 
			if (data.hasOwnProperty('move')) {
								
				//Expect a QMN String - Example: A5B4 
				var qmn = data.move;				
				var move = board.qmnToMove(qmn);
				move.player = PLAYER_THESEUS;
				if (move) {					
					return onPlayed(move);							
				}
				else return alert ('Player attempted invalid move: ' + btmn);				
				
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

})(); //End PicketPlayer namespace