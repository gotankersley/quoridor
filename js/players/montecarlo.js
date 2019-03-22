/*
Opt:
-crit region only
-UCT
-multicore
-wasm
-significant delta action
-percentage move shortest path

*/
var MonteCarloPlayer = (function() { //Poor man's namespace (module pattern)

	const MAX_GAMES = 20000;

	const MOVE_LIMIT = 30;
	const SIM_WIN = 10;		
	const SIM_LOSE = -10;
	
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
			console.log('MonteCarlo: Win found');
			var typeDest = plays[0];			
			var move = BoardLite_toBoardMove(bl, turn, typeDest);
			return onPlayed(move);	
		}
		else if (gameTheoreticalScore == -INFINITY) {
			console.log('MonteCarlo: Inevitable loss');
			var typeDest = plays[0];			
			var move = BoardLite_toBoardMove(bl, turn, typeDest);
			return onPlayed(move);			
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

	/*
	function simulateCritRegion(b, currentTurn, playsRef) {
		
		var turn = OPP_TURN[currentTurn];
		
		var cacheRef1 = new Uint16Array(WALL_SPACES+1); //[WallType * 64][Min Dist]
		var cacheRef2 = new Uint16Array(WALL_SPACES+1); //[WallType * 64][Min Dist]
		SIM_LOOP:
		for (var p = 0; p < MOVE_LIMIT; p++) {	
			playsRef[MAX_PLAYS] = 0;
			
			BoardLite_addMoves(b, turn, playsRef);
			BoardLite_addJumps(b, turn, playsRef);		
			var gameOverScore = BoardLite_winOrBlock(b, turn, playsRef);
			
			if (gameOverScore == IN_PLAY) {
				//Random Move
				if (b[WALL_COUNT+turn] == 0 || rnd(101) <= 85) {
					if (rnd(100) < 50) BoardLite_makeRandomMove(b, turn, playsRef);
					else { //Make min move
						var distOrigin = BoardLite_Path_Min_getDistAndOrigin(b, turn);
						var dest = distOrigin[1] & MASK_DEST;
						BoardLite_makeMove(b, turn, dest);
					}
				}

				//Random Place
				else {
					BoardLite_Path_Min_populateCache(b, PLAYER1, cacheRef1); 
					BoardLite_Path_Min_populateCache(b, PLAYER2, cacheRef2); 
					var places = [];
					//Restrict to Critical area
					for (var w = 0; w < WALL_SPACES; w++) {
						if (cacheRef1[w] & TYPE_WALL) places.push(w | cacheRef1[w]);
						else if (cacheRef2[w] & TYPE_WALL) places.push(w | cacheRef2[w]);
						else if (BoardLite_touchesNeighbor(b, w, TYPE_HORZ >>> 9)) places.push(w | TYPE_HORZ);
						else if (BoardLite_touchesNeighbor(b, w, TYPE_VERT >>> 9)) places.push(w | TYPE_VERT);							
					}
					for (var i = 0; i < 3; i++) {
						var randIndex = Math.floor(Math.random() * places.length);
						var randTypeDest = places[randIndex];
						var randType = randTypeDest & MASK_TYPE;
						var randDest = randTypeDest & MASK_DEST;
						if (BoardLite_canPlace(b, randDest, randType)) {
							BoardLite_makePlace(b, turn, dest, type);
							continue SIM_LOOP;
						}
					}					
					BoardLite_makeRandomMove //Give up and move if no legal place found
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
					for (var i = 0; i < playsRef[MAX_PLAYS]; i++) {						
						var typeDest = playsRef[i];
						var type = typeDest & MASK_TYPE;
						var dest = typeDest & MASK_DEST;
						//Unable to block
						if (turn == currentTurn) return SIM_LOSE;
						else return SIM_WIN;
						causing it to crash
						// if (type & TYPE_MOVE_JUMP) {
						// 	BoardLite_makeMove(b, turn, dest);
						// 	continue SIM_LOOP;
						// }
						// else {
						// 	if (BoardLite_canPlace(b, dest, type)){
						// 		BoardLite_makePlace(b, turn, dest, type);
						// 		continue SIM_LOOP;
						// 	}								
						// }
						
					}
					
									
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
	*/
	
	//Exports
	return {
		getPlay:play
	}

})(); //End namespace MonteCarloPlayer