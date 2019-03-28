var WasmPlayer = (function() { //Poor man's namespace (module pattern)
	const WASM_FILE = '/quoridor/wasm/quoridor.wasm';

	const OUTPUT = 24;

	var wasmInstance;
	var memory;
	var hasLoaded = false;
	var sharedMemory;

	function init(board, onPlayed) {
		memory = new WebAssembly.Memory({initial:OUTPUT+1, maximum:100});
		WebAssembly.instantiateStreaming(fetch(WASM_FILE), { js: { mem: memory } })
		.then(obj => {
			wasmInstance = obj.instance;
			// obtain the offset to the array which is shared memory
			var offset = wasmInstance.exports.getsharedMemoryPtr();		
			
			//Create a view on the memory that points to this array
			sharedMemory = new Uint32Array(wasmInstance.exports.memory.buffer, offset, OUTPUT+1);

			hasLoaded = true;
			play(board, onPlayed);
		});
	}
	function play(board, onPlayed) {	
		if (!hasLoaded) return init(board, onPlayed);
		var turn = board.turn;
		
		//Instead of serializing to a string, instead put data directly into the shared wasm memory 
		var i = 1; //Store wall count at zero
		for (var r = 0; r < WALL_SIZE; r++) {
			for (var c = 0; c < WALL_SIZE; c++) {
				var wallType = board.walls[r][c];							
				if (wallType == H_WALL) sharedMemory[i++] = TYPE_HORZ;
				else if (wallType == V_WALL) sharedMemory[i++] = TYPE_VERT;			
			}
		}	
		sharedMemory[0] = i; //wall count

		//Pawns
		sharedMemory[i++] = (board.pawns[PLAYER1].r*FLOOR_SIZE)+board.pawns[PLAYER1].c;		
		sharedMemory[i++] = (board.pawns[PLAYER2].r*FLOOR_SIZE)+board.pawns[PLAYER2].c;				
		
		//Wallcounts
		sharedMemory[i++] = board.wallCounts[PLAYER1];		
		sharedMemory[i++] = board.wallCounts[PLAYER2];		
	

		//Call the WebAssembly function - (this is the raison d'etre)
		var x = wasmInstance.exports.play(turn);
		console.log

		//Get the results from the previous wasm function call
		var typeDest = sharedMemory[OUTPUT];
		var move = toBoardMove(board.pawns[turn], typeDest);		
		
		return onPlayed(move);
	}
	
	function toBoardMove(pawn, typeDest) {		
		if (typeof (typeDest) == 'undefined' || typeDest === null || typeDest < 0) throw new Error('Invalid move:', typeDest);
		var dest = typeDest & MASK_DEST;
		var type = typeDest & MASK_TYPE;
	
		console.log('Dest:', dest, 'Type:', type);
		if (type & TYPE_MOVE_JUMP) return {sr:pawn.r, sc:pawn.c, dr:FLOOR_POS_TO_R[dest], dc:dest%FLOOR_SIZE, type:FLOOR}; 
		else {
			var wallType = (type == TYPE_HORZ)? H_WALL : V_WALL;
			return {r:WALL_POS_TO_R[dest], c:dest%WALL_SIZE, type:wallType};
		}
	
	}

	//Exports
	return {
		getPlay:play
	}

})(); //End namespace WasmPlayer