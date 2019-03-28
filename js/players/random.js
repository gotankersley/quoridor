var RandomPlayer = (function() { //Poor man's namespace (module pattern)
	var moveProbabilities = [INVALID,INVALID];

	function play(board, onPlayed) {	
	
		var turn = board.turn;
		var bl = BoardLite_fromBoard(board);
		var plays = new Uint16Array(MAX_PLAYS+1);		
		var cachePath1 = new Uint16Array(WALL_SPACES+1); //[WallType * 64][Min Dist]
		var cachePath2 = new Uint16Array(WALL_SPACES+1); //[WallType * 64][Min Dist]	
		
		
		var moveProbability = moveProbabilities[turn];
		if (moveProbability > 0 && Math.random() < moveProbability) {
			var gameOverScore = BoardLite_winOrBlock(bl, turn, plays);			
			if (gameOverScore == IN_PLAY) {
		
				BoardLite_addMoves(bl, turn, plays);
				BoardLite_addJumps(bl, turn, plays);	
			}
			else BoardLite_getPlays(bl, turn, plays, cachePath1, cachePath2, true);
		}
		else BoardLite_getPlays(bl, turn, plays, cachePath1, cachePath2, true);

		var randIndex = Math.floor(Math.random() *  plays[MAX_PLAYS]);	
		var randTypeDest = plays[randIndex];					
		var move = BoardLite_toBoardMove(bl, turn, randTypeDest);
		return onPlayed(move);		
		
	}
	
	function configPlayer(player) {
		//Complete random
		//Smart random
		//Weighted between places/moves
		moveProbabilities[player] = prompt('Weighted move probability: [0-1]\r\n(-1 for unweighted)', moveProbabilities[player] );		
		
	}

	//Exports
	return {
		getPlay:play, configPlayer:configPlayer
	}

})(); //End namespace RandomPlayer