var NetworkPlayer = (function() { //Network namespace (Module pattern)			
	var networkUrls = [INVALID,INVALID];		
	var playerId = +(new Date()); //Timestamp
	
	function getPlay(board, onPlayed) {			
		var turn = board.turn;
		
		var url = getDefaultUrl(turn);
		if (!url || url == '') {
			if (!configPlayer(turn)) return;
		}
		
		var qsStart = (url.lastIndexOf('?') > 0)? '&' : '?'; //Horrible format
		var queryString = qsStart + 'id=' + playerId + '&tqbn=' + board.toString();
		url += queryString;
		
		ajax(url, function(data, status) {
			//Optional argument to log info 
			if (data.hasOwnProperty('alert')) alert(data.alert); 
			if (data.hasOwnProperty('log')) console.log(data.log); 
			if (data.hasOwnProperty('move')) {
								
				//Expect a QMN String - Example: A5B4 
				var qmn = data.move;				
				var move = board.qmnToMove(qmn);
				move.player = PLAYER_NETWORK;
				if (move) {					
					return onPlayed(move);							
				}
				else return alert ('Player attempted invalid move: ' + btmn);				
				
			}
			else return alert('Expected a JSON object containing "move" attribute.');
		});
		
	}
	
	function getDefaultUrl(player) {
		var url = networkUrls[player];
		if (url == INVALID) {		
			var defaultUrl = menu.getDefault('networkUrl' + player, null); 
			if (!defaultUrl) return '';
			else return defaultUrl;
		}
		else return url;
	}
	
	function configPlayer(player) {
		var oldUrl = getDefaultUrl(player);		
		var newUrl = prompt('Enter a service URL:', oldUrl );
		if (!newUrl) return;
		var propertyName = MENU_PREFIX + 'networkUrl' + player;	
		localStorage.setItem(propertyName, newUrl);
		networkUrls[player] = newUrl;
		
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
	return {getPlay:getPlay, configPlayer:configPlayer};

})(); //End NetworkPlayer namespace