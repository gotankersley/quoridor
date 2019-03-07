var centers = [
	0,512,256,256,512,512,0,0,256,512,512,0,512,256,512,512,256,256,0,0,0,512,512,256,256,256,0,0,256,256,256,256,256,256,0,0,0,256,256,512,256,256,0,0,0,0,512,512,256,256,0,0,0,0,0,0,256,256,0,0,0,0,0,0,0
];
var board = game.board.copy();
for (var p = 0; p < WALL_SPACES; p++) {
	var r = WALL_POS_TO_R[p];
	var c = p%WALL_SIZE;
	var type = centers[p];
	var boardType;
	if (type == TYPE_HORZ) boardType = H_WALL;
	else if (type == TYPE_VERT) boardType = V_WALL;
	else continue;
	board.walls[r][c] = boardType;
}

game.updateBoard(board);