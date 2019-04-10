var HeuristicPlayer = (function() { //Poor man's namespace (module pattern)
		
	
	function getPlay(board, onPlayed) {	
	
		var turn = board.turn;
		var oppTurn = OPP_TURN[turn];

		var bl = BoardLite_fromBoard(board);		


		var plays = new Uint16Array(MAX_PLAYS+1);
		var cachePath1 = new Uint16Array(WALL_SPACES+1); //[WallType * 64][Min Dist]
		var cachePath2 = new Uint16Array(WALL_SPACES+1); //[WallType * 64][Min Dist]	
		
		var gameTheoreticalScore = BoardLite_getPlays(bl, turn, plays, cachePath1, cachePath2, true, true);
		if (plays[MAX_PLAYS] == 0) throw new Error('No moves available');
		else if (gameTheoreticalScore == -INFINITY) {
			console.log('Heuristic: Inevitable loss');
			var typeDest = plays[0];			
			var move = BoardLite_toBoardMove(bl, turn, typeDest);
			return onPlayed(move);			
		}			

					
		var bestScore = -INFINITY;
		var bestPlayIndex = -1;
		//var noPlaceCount1 = plays[MAX_PLAYS-1-turn];
		//var noPlaceCount2 = plays[MAX_PLAYS-1-oppTurn];

		for (var p = 0; p < plays[MAX_PLAYS]; p++) {
			var typeDest = plays[p];
			var dest = typeDest & MASK_DEST;
			var type = typeDest & MASK_TYPE;				
			
			var childBoard = bl.slice();
			
			if (type == TYPE_MOVE) BoardLite_makeMove(childBoard, turn, dest);
			else BoardLite_makePlace(childBoard, turn, dest, type);

			
			var score = BoardLite_score2(childBoard, turn);
			//var score = BoardLite_score3(childBoard, turn, noPlaceCount1, noPlaceCount2);
			//console.log(p + '-', score)	
			
			if (score > bestScore){ 
				bestScore = score;
				bestPlayIndex = p;
			}
			
		}

				
		//Pick best move
		console.log('BestScore: ' + bestScore);
		var typeDest = plays[bestPlayIndex];
		var dest = typeDest & MASK_DEST;
		var type = typeDest & MASK_TYPE;		
		var move = BoardLite_toBoardMove(bl, turn, typeDest);
		return onPlayed(move);			
		
	}

	
	//Exports
	return {
		getPlay:getPlay
	}

})(); //End namespace HeuristicPlayer
