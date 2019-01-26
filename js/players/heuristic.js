var HeuristicPlayer = (function() { //Poor man's namespace (module pattern)
	
	var INFINITY = 1000000;

	function getPlay(board, onPlayed) {	
	
		var oppTurn = +(!board.turn);
		var oppPawn = board.pawns[oppTurn];
		//Try to block
		var oppPreWinRow = ENDING_ROWS[oppTurn]+ADVANCE_DIR[oppTurn];
		var endingRow = ENDING_ROWS[oppTurn];
		if (oppPawn.r == oppPreWinRow) {
			var placeCode;
			if (oppPawn.c - 1 >= 0) {
				placeCode = board.validatePlace(endingRow, oppPawn.c-1, H_WALL);
				if (placeCode == VALID) return onPlayed({r:endingRow, c:oppPawn.c-1, type:H_WALL});
			}
			else if (oppPawn.c < WALL_SIZE) {
				placeCode = board.validatePlace(endingRow, oppPawn.c, H_WALL);
				if (placeCode == VALID) return onPlayed({r:endingRow, c:oppPawn.c, type:H_WALL});
			}
		}

		var moves = board.getMoves();		
		if (!moves.length) throw new Error('No moves available');
		
		var bestScore = -INFINITY;
		var bestMoveIndex = -1;
		for (var m = 0; m < moves.length; m++) {
			var move = moves[m];
			var boardCopy = board.copy();
			boardCopy.makeMove(move);
			var score = boardCopy.score();
			if (score > bestScore){ 
				bestScore = score;
				bestMoveIndex = m;
			}
		}
				
		
		if (bestMoveIndex < 0) {
			console.log('No best move found');			
			return onPlayed();
		}
		else {	
			console.log('BestScore: ' + bestScore);
			return onPlayed(moves[bestMoveIndex]);														
		}
		
	}
	
	//Exports
	return {
		getPlay:getPlay
	}

})(); //End namespace HeuristicPlayer
