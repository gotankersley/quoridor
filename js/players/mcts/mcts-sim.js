var root;
var rowIds = [];
var MCTSPlayer = (function() { //Poor man's namespace (module pattern)

	const MAX_GAMES = 10000;
	const MAX_DEPTH = 30;
	const UCT_TUNING = 0.001;//30;//0.1;//0.9; //Controls exploration (< 1) vs. exploitation (> 1)	
	const MOVE_LIMIT = 40;

	const SIM_WIN = 2;		
	const SIM_LOSE = -2;
	/*
	Opt:
	- Transposition
	- Path caching
	- DFS insted of G*?
	- Crit region
	- WallOnly sim
	- WASM
	- web workers
	- Bitboards
	*/
	var totalDepth;
	var totalNodes;
	function play(board, onPlayed) {	
		boardy = board.copy();			
		var timeStart = performance.now();
		totalDepth = 0;
		totalNodes = 0;
		var turn = board.turn;					
		var bl = BoardLite_fromBoard(board);			
		rowIds = new Uint32Array(MAX_DEPTH);
		//var
		root = {visits:1, score:0, board:bl, turn:turn, parent:null, children:[], rowId:0, depth:0};
		var gameOverScore = expandScoreAndPropagate(root); //Pre-expand root		
		if (gameOverScore == INFINITY) {
			console.log('MCTS: Win found');
			var distOrigin = BoardLite_Path_Min_getDistAndOrigin(bl, turn);
			var dist = distOrigin[0];
			var move;
			if (dist == 1) {
				var pawn = board.pawns[turn];
				move = {sr:pawn.r, sc:pawn.c, dr:WIN_ROWS[turn], dc:pawn.c, type:FLOOR};
			}
			else {
				var origin = distOrigin[1];		
				move = BoardLite_toBoardMove(bl, turn, origin | TYPE_MOVE);								
			}				
			return onPlayed(move);
		}
		else if (gameOverScore == -INFINITY) {
			console.log('MCTS: Inevitable loss');
			var distOrigin = BoardLite_Path_Min_getDistAndOrigin(bl, turn);
			var origin = distOrigin[1];		
			var move = BoardLite_toBoardMove(bl, turn, origin | TYPE_MOVE);
			return onPlayed(move);			
		}	
						

		//Start building UCT tree
		for (var g = 0; g < MAX_GAMES; g++) {
			//Select
			var node = uctSelect(root);
			if (node.score == INFINITY) backProp(node, -INFINITY);
			else if (node.score == -INFINITY) backProp(node, INFINITY);
			else if (node.visits < 5) {
				var boardCopy = node.board.slice();
				var score = simulate(boardCopy, turn);
				backProp(node, -score);
			}
			else expandScoreAndPropagate(node); //Expand, Score and Backpropagate 

		}
		
		
		//Pick final move	
		var finalNode = pickFinalMove(root);

		var duration = performance.now() - timeStart;
		console.log('Duration: ' + duration);
		console.log('FinalScore: ' + finalNode.score);
		console.log('FinalVisits: ' + finalNode.visits);
		console.log('Depth: ' + totalDepth);
		console.log('Nodes: ' + totalNodes);
		
		

		//Derive move
		var finalMove = BoardLite_deriveMove(bl, finalNode.board, turn);
		return onPlayed(finalMove);	
	}
	


	function uctSelect(node) { //Recursive
		
		var bestUCT = -INFINITY;
		var bestNode = null;		
		for (var i = 0; i < node.children.length; i++ ){ 
			var child = node.children[i];		
			
			//Upper Confidence Bound for Trees - Multi-armed bandit problem to maximize payoff
			var uct = (child.score + UCT_TUNING) * Math.sqrt(Math.log(child.parent.visits) / child.visits); 
			if (uct > bestUCT) {
				bestUCT = uct;
				bestNode = child;
			}
		} 
		if (!bestNode) {//Inevitable loss?
			node.parent.score = INFINITY;
			return node.parent;
			
		}
		bestNode.visits++;

		//Anchor
		if (!bestNode.children.length) return bestNode;					
		else return uctSelect(bestNode);		
	}

	
	
	function expandScoreAndPropagate(node) {
		if (node.children.length) throw new Error("Node is not a leaf");
		var turn = node.turn;
		var newDepth = node.depth+1;
		totalDepth = Math.max(totalDepth, newDepth);

		var playsRef = new Uint16Array(MAX_PLAYS+1);							
		var cacheRef1 = new Uint16Array(WALL_SPACES+1); //[WallType * 64][Min Dist]
		var cacheRef2 = new Uint16Array(WALL_SPACES+1); //[WallType * 64][Min Dist]			
		var gameOverScore = BoardLite_getPlays(node.board, turn, playsRef, cacheRef1, cacheRef2, true, false); //Crit region only
		//Terminal
		if (gameOverScore == INFINITY || gameOverScore == -INFINITY) {
			var child = {visits:1, score:gameOverScore, board:null, turn:OPP_TURN[turn], parent:node, children:[], rowId:rowIds[newDepth]++, depth:newDepth};
			node.score = gameOverScore;
			return backProp(node, gameOverScore);			
		}
		//Else IN_PLAY, or MUST_PLAY

		//Add expand by adding children		
		totalNodes += playsRef[MAX_PLAYS];
		var bestScore = -INFINITY;
		for (var p = 0; p < playsRef[MAX_PLAYS]; p++) {
			var typeDest = playsRef[p];
			var type = typeDest & MASK_TYPE;
			var dest = typeDest & MASK_DEST;
			var childBoard = node.board.slice();
			if (type & TYPE_MOVE_JUMP) BoardLite_makeMove(childBoard, turn, dest);
			else BoardLite_makePlace(childBoard, turn, dest, type);
			
			var score = simulate(childBoard, turn);
			//var score = BoardLite_score2(childBoard, turn);
			
			var child = {visits:1, score:score, board:childBoard, turn:OPP_TURN[turn], parent:node, children:[], rowId:rowIds[newDepth]++, depth:newDepth};
			node.children.push(child);
			if (score > bestScore) bestScore = score;			
		}
		return backProp(node.parent, -bestScore);
		
	}
	

	function backProp(node, newScore) {
		if (!node) return newScore;
		var parent = node.parent;
		var score = newScore;
		while (parent) {
			parent.visits++;
			if (score == INFINITY) parent.score = INFINITY;
			else if (score == -INFINITY) parent.score = -INFINITY; //I don't think we need to worry about overestimation, (and checking all children), because of the way we expand
			else parent.score = ((parent.score * (parent.visits - 1)) + score) / parent.visits;  //Average
			parent = parent.parent; //Grandpa
			score = -score; //switch for minmax
		}
		return newScore;
	}

	function pickFinalMove(node) {
		var bestVisits = -INFINITY;
		var bestNode = null;		
		for (var i = 0; i < node.children.length; i++ ){ 
			var child = node.children[i];		
			if (child.visits > bestVisits) {
				bestVisits = child.visits;
				bestNode = child;
			}
		}

		return bestNode;
	}

	function simulateHeuristic(b, currentTurn) {
		
		var turn = OPP_TURN[currentTurn];

		for (var p = 0; p < MOVE_LIMIT; p++) {	
			
			var playsRef = new Uint16Array(MAX_PLAYS+1);
			var cachePath1 = new Uint16Array(WALL_SPACES+1); //[WallType * 64][Min Dist]
			var cachePath2 = new Uint16Array(WALL_SPACES+1); //[WallType * 64][Min Dist]
			var gameOverScore = BoardLite_getPlays(b, turn, playsRef, cachePath1, cachePath2, true, false);
			if (gameOverScore == IN_PLAY) {
				var bestScore = -INFINITY;
				var bestPlayIndex = 0; //default to first if loss				
				for (var p = 0; p < playsRef[MAX_PLAYS]; p++) {
					var typeDest = playsRef[p];
					var dest = typeDest & MASK_DEST;
					var type = typeDest & MASK_TYPE;				
					
					var childBoard = b.slice();
					
					if (type == TYPE_MOVE) BoardLite_makeMove(childBoard, turn, dest);
					else BoardLite_makePlace(childBoard, turn, dest, type);
									
					var score = BoardLite_score2(childBoard, turn);			
										
					if (score > bestScore){ 
						bestScore = score;
						bestPlayIndex = p;						
					}					
					
				}
								
				var typeDest = playsRef[bestPlayIndex];
				var dest = typeDest & MASK_DEST;
				var type = typeDest & MASK_TYPE;	
				if (type == TYPE_MOVE) BoardLite_makeMove(b, turn, dest);
				else BoardLite_makePlace(b, turn, dest, type);
								
			}
			//Game Over
			else {			
				if (gameOverScore == INFINITY) {
					if (turn == currentTurn) {
						var dist = BoardLite_Path_Min_getDist(b, OPP_TURN[turn]); 
						return dist/81;// SIM_WIN;
					}
					else {
						var dist = BoardLite_Path_Min_getDist(b, turn); 
						return (81-dist)/81;//SIM_LOSE;
					}
				}
				else if (gameOverScore == -INFINITY) {
					if (turn == currentTurn) {
						var dist = BoardLite_Path_Min_getDist(b, turn); 
						return (81-dist)/81;//SIM_LOSE;
					}
					else {
						var dist = BoardLite_Path_Min_getDist(b, OPP_TURN[turn]); 
						return dist/81;// SIM_WIN;
					}
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
		if (score >= 0) return 0.1;
		else return -0.1;
	}
	
	function simulate(b, currentTurn) {
		
		
		var turn = OPP_TURN[currentTurn];

		for (var p = 0; p < MOVE_LIMIT; p++) {					

			
			var playsRef = new Uint16Array(MAX_PLAYS+1);
			var cachePath1 = new Uint16Array(WALL_SPACES+1); //[WallType * 64][Min Dist]
			var cachePath2 = new Uint16Array(WALL_SPACES+1); //[WallType * 64][Min Dist]
			var gameOverScore = BoardLite_getPlays(b, turn, playsRef, cachePath1, cachePath2, true, false);
			
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
					BoardLite_makeRandomPlace(b, turn, playsRef);					
				}		
							
								
			}
			//Game Over
			else {			
				if (gameOverScore == INFINITY) {
					if (turn == currentTurn) {
						var dist = BoardLite_Path_Min_getDist(b, OPP_TURN[turn]); 
						return dist/81;// SIM_WIN;
					}
					else {
						var dist = BoardLite_Path_Min_getDist(b, turn); 
						return (81-dist)/81;//SIM_LOSE;
					}
				}
				else if (gameOverScore == -INFINITY) {
					if (turn == currentTurn) {
						var dist = BoardLite_Path_Min_getDist(b, turn); 
						return (81-dist)/81;//SIM_LOSE;
					}
					else {
						var dist = BoardLite_Path_Min_getDist(b, OPP_TURN[turn]); 
						return dist/81;// SIM_WIN;
					}
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
		if (score >= 0) return 0.1;
		else return -0.1;
	}

	
	//Exports
	return {
		getPlay:play
	}

})(); //End namespace MCTSPlayer