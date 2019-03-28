var MCTSPlayer = (function() { //Poor man's namespace (module pattern)

	const MAX_GAMES = 1;

	const MOVE_LIMIT = 30;
	const SIM_WIN = 1;		
	const SIM_LOSE = -1;
	
	function play(board, onPlayed) {			
		var timeStart = performance.now();
		var turn = board.turn;					
		var bl = BoardLite_fromBoard(board);		

		var plays = new Uint16Array(MAX_PLAYS+1);
		var cachePath1 = new Uint16Array(WALL_SPACES+1); //[WallType * 64][Min Dist]
		var cachePath2 = new Uint16Array(WALL_SPACES+1); //[WallType * 64][Min Dist]	
		
		var gameTheoreticalScore = BoardLite_getPlays(bl, turn, plays, cachePath1, cachePath2, true);
		if (plays[MAX_PLAYS] == 0) throw new Error('MC:No moves available');
		else if (gameTheoreticalScore == INFINITY) {
			console.log('MCTS: Win found');
			var typeDest = plays[0];			
			var move = BoardLite_toBoardMove(bl, turn, typeDest);
			return onPlayed(move);	
		}
		else if (gameTheoreticalScore == -INFINITY) {
			console.log('MCTS: Inevitable loss');
			var typeDest = plays[0];			
			var move = BoardLite_toBoardMove(bl, turn, typeDest);
			return onPlayed(move);			
		}	

		//Start MCTS
		var root = {visits:0, score:0, board:board, parent:null, children:[]};	
		for (var g = 0; g < MAX_GAMES; g++) {

		}
								
		var simPlays = new Uint16Array(MAX_PLAYS+1);
		var bestScore = -INFINITY;
		var bestPlayIndex = -1;
		for (var p = 0; p < plays[MAX_PLAYS]; p++) {
			var typeDest = plays[p];
			var dest = typeDest & MASK_DEST;
			var type = typeDest & MASK_TYPE;				
			
			var childBoard = bl.slice();
			
			if (type & TYPE_MOVE_JUMP) BoardLite_makeMove(childBoard, turn, dest);
			else {
				var wallTypeIndex = type >>> 9;
				//Check if on crit-region
				if ((cachePath1[dest] | cachePath2[dest]) & TYPE_WALL) { //Part of player(s) path 				
					BoardLite_makePlace(childBoard, turn, dest, type);
				}
				else if (BoardLite_touchesNeighbor(childBoard, dest, wallTypeIndex)){
					BoardLite_makePlace(childBoard, turn, dest, type);
				}
				else if (gameTheoreticalScore == MUST_PLAY) {
					BoardLite_makePlace(childBoard, turn, dest, type);
				}
				else continue;
			}
												
			
			var score = 0;
			for (var i = 0; i < MAX_GAMES; i++) {
				var boardCopy = childBoard.slice();
				var simResult = simulate(boardCopy, turn, simPlays);
				score += simResult;
			}
			
			if (score > bestScore){ 
				bestScore = score;
				bestPlayIndex = p;
			}
			console.log(p + ' - ' + score);			
		}
		
		
		//Pick best move - Eeny, meeny, miny, moe...		
		var duration = performance.now() - timeStart;
		console.log('Duration: ' + duration);
		console.log('BestScore: ' + bestScore);
		var typeDest = plays[bestPlayIndex];
		var dest = typeDest & MASK_DEST;
		var type = typeDest & MASK_TYPE;		
		var move = BoardLite_toBoardMove(bl, turn, typeDest);
		return onPlayed(move);	
	}
	
	function mctsSolver(node) {		
		//Anchor
		if(playerToMoveWins(node)) return INFINITY;
		else if (playerToMoveLoses(node)) return -INFINITY;

		//Select
		var bestChild = uctSelect(node); //UCT
		node.visits++;
		var score;		
		if(bestChild.score != -INFINITY && bestChild.score != INFINITY) { //Terminal
			if(bestChild.visits == 0){
				score = -playOut(bestChild);
				node.parent.push(bestChild);
				node.computeAverage(score);
				return score;
			}
			else score = -mctsSolver(bestChild); //Recurse
		}

		//Backprop
		else { 
			score = bestChild.score;
			if(score == INFINITY){ //Win
				node.score = -INFINITY; 
				return score;
			}
			else if(score == -INFINITY){
				for (var c = 0; c < node.children.length; c++) {
					var child = node.children[c];
					if(child.score != -INFINITY){						
						node.computeAverage(SIM_LOSE);
						return SIM_LOSE; //Not a proven loss
					}
				}
				node.score = INFINITY; //Proven loss
				return score;
			}
			
		}
			
		node.computeAverage(score);
		return score;

	}

	function simulate(b, currentTurn, playsRef) {
		
		var turn = OPP_TURN[currentTurn];

		for (var p = 0; p < MOVE_LIMIT; p++) {	
			playsRef[MAX_PLAYS] = 0;			

			
			var gameOverScore = BoardLite_winOrBlock(b, turn, playsRef);
			
			if (gameOverScore == IN_PLAY) {
				var oppTurn = OPP_TURN[turn];
				var distOrigin1 = BoardLite_Path_Min_getDistAndOrigin(b, turn);
				var distOrigin2 = BoardLite_Path_Min_getDistAndOrigin(b, oppTurn);

				var dist1 = distOrigin1[0];
				var dist2 = distOrigin2[0];

				if (dist1 <= dist2 || b[WALL_COUNT+turn] == 0) {
					var typeDest = distOrigin1[1];
					var type = typeDest & MASK_TYPE;
					var dest = typeDest & MASK_DEST;
					BoardLite_makeMove(b, turn, dest);
				}
				else {					
					BoardLite_addMoves(b, turn, playsRef);
					BoardLite_addJumps(b, turn, playsRef);		
					if (rnd(135) <= 130) BoardLite_makeRandomPlace(b, turn, playsRef);
					else BoardLite_makeRandomMove(b, turn, playsRef);
				}		
							
								
			}
			//Game Over
			else {			
				if (gameOverScore == INFINITY) {
					if (turn == currentTurn) return SIM_WIN;
					else return SIM_LOSE;
				}
				else if (gameOverScore == -INFINITY) {
					if (turn == currentTurn) return SIM_LOSE;
					else return SIM_WIN;
				}
				else if (gameOverScore == MUST_PLAY) { //Forced move
										
					var typeDest = playsRef[0];
					var type = typeDest & MASK_TYPE;
					var dest = typeDest & MASK_DEST;												
					BoardLite_makePlace(b, turn, dest, type);									
				}
				
			}
					
			
			//Change Turn
			turn = +(!turn);				
		}

		//Score
		var score = BoardLite_score2(b, currentTurn);
		if (score >= 0) return 0.5;
		else return -0.5;
	}

	
	//Exports
	return {
		getPlay:play
	}

})(); //End namespace MCTSPlayer