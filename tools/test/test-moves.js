
function runTests() {
    var board = new Board();
    var bl = BoardLite_fromBoard(board);
    
    
    for (var p = 0; p < FLOOR_SPACES; p++) {
        var r = Math.floor(p/FLOOR_SIZE);
        var c = p % FLOOR_SIZE;
        var pawnR = FLOOR_POS_TO_R[p];
        var pawnC = p%FLOOR_SIZE;
        var oppPawn = (p+3)%WALL_SPACES;
        var oppPawnR = FLOOR_POS_TO_R[oppPawn];
        var oppPawnC = oppPawn%FLOOR_SIZE;
        
        BoardLite_makeMove(bl, PLAYER1, p);
        board.movePawn(pawnR, pawnC);

        BoardLite_makeMove(bl, PLAYER2, oppPawn);
        board.turn = PLAYER2;
        board.movePawn(oppPawnR, oppPawnC);
        board.turn = PLAYER1;
        var turn = PLAYER1;
        
        for (var wallType = H_WALL; wallType < V_WALL; wallType++) {
            for (var w = 0; w < WALL_SPACES; w++) {
                var wallR = WALL_POS_TO_R[w];
                var wallC = w%WALL_SIZE;

                //Copy
                var blCopy = bl.slice();
                var boardCopy = board.copy();

                //Place wall
                BoardLite_makePlace(blCopy, turn, w, wallType);
                boardCopy.placeWall(wallR, wallC, wallType);

                var blTqbn = BoardLite_toString(blCopy, turn);
                var boardTqbn = boardCopy.toString();
                assert(blTqbn, boardTqbn, boardTqbn);

                //Get moves
                var blMoves = BoardLite_getMoves(blCopy, turn).sort(sortNumber);
                var boardMoves = convertBoardMoves(boardCopy.getMoves(FLOOR)).sort(sortNumber);
                 
                assert(areMovesEqual(blMoves, boardMoves), true, 'src: ' + p + ', wall: ' + w + ', type:' + wallType);                
                n++;                        
            }
        }
        //if (canMove(r, c, r+1, c)) onMove(moves, p, getPos(r+1, c)); //Down
        //if (canMove(r, c, r-1, c)) onMove(moves, p, getPos(r-1, c)); //Up
        //if (canMove(r, c, r, c+1)) onMove(moves, p, getPos(r, c+1));  //Right
        //if (canMove(r, c, r, c-1)) onMove(moves, p, getPos(r, c-1));  //Left  
    }    
    
}

function areMovesEqual(moves1, moves2) {
    if (moves1.length != moves2.length) return false;
    for (var m = 0; m < moves1.length; m++) {
        if (moves1[m] != moves2[m]) return false;
    }
    return true;
}

/*function onMove(moves, src, dst) {
    var moveFound = false;
    if (moves.indexOf(dst) >= 0) moveFound = true;
    
    assert(moveFound, true, src + ',' + dst, 'here');

}*/

function convertBoardMoves(boardMoves) {
    var moves = [];
    for (var m = 0; m < boardMoves.length; m++) {
        var move = boardMoves[m];
        if (move.type == FLOOR) moves.push(getPos(move.dr, move.dc));

    }
    return moves;
}

function canMove(sr, sc, dr, dc) {
    if (sr < 0 || sr >= FLOOR_SIZE) return false;
    else if (sc < 0 || sc >= FLOOR_SIZE) return false;
    else if (dr < 0 || dr >= FLOOR_SIZE) return false;
    else if (dc < 0 || dc >= FLOOR_SIZE) return false;
    else return true;

}

function getPos(r, c) {
	return (r*FLOOR_SIZE)+c;
}

function sortNumber(a,b) {
	return a - b;
}
