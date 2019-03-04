var RandomPlayer = (function() { //Poor man's namespace (module pattern)

	function play(board, onPlayed) {	
	
		var turn = board.turn;
		var bl = BoardLite_fromBoard(board);
		var plays = new Uint16Array(MAX_PLAYS+1);		
		var cachePath1 = new Uint16Array(WALL_SPACES+1); //[WallType * 64][Min Dist]
		var cachePath2 = new Uint16Array(WALL_SPACES+1); //[WallType * 64][Min Dist]	
		BoardLite_getPlays(bl, turn, plays, cachePath1, cachePath2, false);
				
		var randIndex = Math.floor(Math.random() *  plays[MAX_PLAYS]);	
		var randTypeDest = plays[randIndex];					
		var move = BoardLite_toBoardMove(bl, turn, randTypeDest);
		return onPlayed(move);

		//TODO: weighted rand?	
		//if (bl[WALL_COUNT+turn] == 0 || Math.random() > 0.5) {	
		//TODO: post verify valid
		
	}
	
	function configPlayer(player) {
		//Complete random
		//Smart random
		//Weighted between places/moves
		console.log(player);
		return;
		var oldUrl = getDefaultUrl(player);		
		var newUrl = prompt('Enter a service URL:', oldUrl );
		if (!newUrl) return;
		var propertyName = MENU_PREFIX + 'networkUrl' + player;	
		localStorage.setItem(propertyName, newUrl);
		networkUrls[player] = newUrl;
		
	}

	//Exports
	return {
		getPlay:play, configPlayer:configPlayer
	}

})(); //End namespace RandomPlayer