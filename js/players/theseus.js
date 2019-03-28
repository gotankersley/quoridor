var TheseusPlayer = (function() { //Picket namespace (Module pattern)			

	var extraParams = [INVALID,INVALID];		
	var playerId = +(new Date()); //Timestamp
	const THESEUS_URL = 'https://schneiderbox.net/theseus';	

	function getPlay(board, onPlayed) {			
		var turn = board.turn;
		var param = getDefaultParam(turn);
		var url = THESEUS_URL + '?' + param;		
		
		var qsStart = (url.lastIndexOf('?') > 0)? '&' : '?'; //Horrible format
		var queryString = qsStart + 'id=' + playerId + '&tqbn=' + board.toString().toUpperCase();
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
	
	function getDefaultParam(player) {
		var param = extraParams[player];
		if (param == INVALID) {		
			var defaultParam = menu.getDefault('extraParam' + player, null); 
			if (!defaultParam) return '';
			else return defaultParam;
		}
		else return param;
	}
	
	function configPlayer(player) {
		var oldParam = getDefaultParam(player);		
		var newParam = prompt('Add querystring params: (e.g. iterations=100)\r\n ' + THESEUS_URL + '?<key=value&...>', oldParam );
		if (!newParam) return;
		var propertyName = MENU_PREFIX + 'extraParam' + player;	
		localStorage.setItem(propertyName, newParam);
		extraParams[player] = newParam;
		
	}

	//Exports
	return {getPlay:getPlay, configPlayer:configPlayer};

})(); //End PicketPlayer namespace