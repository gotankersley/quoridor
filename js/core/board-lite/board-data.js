const WALL_SIZE = 8;
const WALL_SPACES = 64;
const FLOOR_SIZE = 9;
const FLOOR_SPACES = 81;

const PLAYER1 = 0;
const PLAYER2 = 1;
const PLAYERS = 2

const OPP_TURN = [1,0];
const WIN_ROWS = [0, FLOOR_SIZE-1];
const PRE_WIN_ROWS = [1, 7];
const PRE_WIN_ROWS2 = [2, 6];


const NORTH = 0; 
const SOUTH = 1;
const EAST = 2;
const WEST = 3;
const DIR_ADVANCE = [NORTH, SOUTH];

const TYPE_NONE = 0;
const TYPE_HORZ = 256; //This is so it can be [type]|[dest]
const TYPE_VERT = 512; //Power of two for bitflags
const TYPE_MOVE = 1024;
const TYPE_JUMP = 2048;
const TYPE_MOVE_JUMP = TYPE_MOVE | TYPE_JUMP;
const TYPE_WALL = TYPE_HORZ | TYPE_VERT;

const MASK_DEST = 0xff;
const MASK_TYPE = 0xff00;



const DELTA_R_BY_DIR = [ 
	-1, //NORTH
	1, //SOUTH
	0,  //EAST
	0, //WEST 
];


const DELTA_C_BY_DIR = [ 
	0, //NORTH
	0, //SOUTH
	1,  //EAST
	-1, //WEST 
];

const DIAG_DIRS = [ // [Dir1, Dir2]
	WEST, EAST, //NORTH 
	WEST, EAST, //SOUTH 
	NORTH, SOUTH, //EAST
	NORTH, SOUTH, //WEST
];

const FLOOR_POS_TO_R = [ //Avoid Math.floor
	0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,7,7,7,7,7,7,7,7,7,8,8,8,8,8,8,8,8,8,
];

const WALL_POS_TO_R = [ //Avoid Math.floor
	0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,3,4,4,4,4,4,4,4,4,5,5,5,5,5,5,5,5,6,6,6,6,6,6,6,6,7,7,7,7,7,7,7,7,
];

const THEORETICAL_MIN = [
	[0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,7,7,7,7,7,7,7,7,7,8,8,8,8,8,8,8,8,8], //Player1
	[8,8,8,8,8,8,8,8,8,7,7,7,7,7,7,7,7,7,6,6,6,6,6,6,6,6,6,5,5,5,5,5,5,5,5,5,4,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0]  //Player2
];

const WALLTYPE_BY_DIR = [
	TYPE_HORZ, //NORTH
	TYPE_HORZ, //SOUTH
	TYPE_VERT, //EAST
	TYPE_VERT, //WEST
];



const POS_DELTA_TO_DIR = [ //To use (9+srcPos-dstPos)
	SOUTH, //-9
	-1, //-8
	-1, //-7
	-1, //-6
	-1, //-5
	-1, //-4
	-1, //-3
	-1, //-2
	EAST, //-1
	-1, //0
	WEST, //1
	-1, //2
	-1, //3
	-1, //4
	-1, //5
	-1, //6
	-1, //7
	-1, //8
	NORTH, //9
];


const MOVES_BY_POS = [ //[dest, dir]...
	[9,1,1,2], //0
	[10,1,2,2,0,3], //1
	[11,1,3,2,1,3], //2
	[12,1,4,2,2,3], //3
	[13,1,5,2,3,3], //4
	[14,1,6,2,4,3], //5
	[15,1,7,2,5,3], //6
	[16,1,8,2,6,3], //7
	[17,1,7,3], //8
	[18,1,0,0,10,2], //9
	[19,1,1,0,11,2,9,3], //10
	[20,1,2,0,12,2,10,3], //11
	[21,1,3,0,13,2,11,3], //12
	[22,1,4,0,14,2,12,3], //13
	[23,1,5,0,15,2,13,3], //14
	[24,1,6,0,16,2,14,3], //15
	[25,1,7,0,17,2,15,3], //16
	[26,1,8,0,16,3], //17
	[27,1,9,0,19,2], //18
	[28,1,10,0,20,2,18,3], //19
	[29,1,11,0,21,2,19,3], //20
	[30,1,12,0,22,2,20,3], //21
	[31,1,13,0,23,2,21,3], //22
	[32,1,14,0,24,2,22,3], //23
	[33,1,15,0,25,2,23,3], //24
	[34,1,16,0,26,2,24,3], //25
	[35,1,17,0,25,3], //26
	[36,1,18,0,28,2], //27
	[37,1,19,0,29,2,27,3], //28
	[38,1,20,0,30,2,28,3], //29
	[39,1,21,0,31,2,29,3], //30
	[40,1,22,0,32,2,30,3], //31
	[41,1,23,0,33,2,31,3], //32
	[42,1,24,0,34,2,32,3], //33
	[43,1,25,0,35,2,33,3], //34
	[44,1,26,0,34,3], //35
	[45,1,27,0,37,2], //36
	[46,1,28,0,38,2,36,3], //37
	[47,1,29,0,39,2,37,3], //38
	[48,1,30,0,40,2,38,3], //39
	[49,1,31,0,41,2,39,3], //40
	[50,1,32,0,42,2,40,3], //41
	[51,1,33,0,43,2,41,3], //42
	[52,1,34,0,44,2,42,3], //43
	[53,1,35,0,43,3], //44
	[54,1,36,0,46,2], //45
	[55,1,37,0,47,2,45,3], //46
	[56,1,38,0,48,2,46,3], //47
	[57,1,39,0,49,2,47,3], //48
	[58,1,40,0,50,2,48,3], //49
	[59,1,41,0,51,2,49,3], //50
	[60,1,42,0,52,2,50,3], //51
	[61,1,43,0,53,2,51,3], //52
	[62,1,44,0,52,3], //53
	[63,1,45,0,55,2], //54
	[64,1,46,0,56,2,54,3], //55
	[65,1,47,0,57,2,55,3], //56
	[66,1,48,0,58,2,56,3], //57
	[67,1,49,0,59,2,57,3], //58
	[68,1,50,0,60,2,58,3], //59
	[69,1,51,0,61,2,59,3], //60
	[70,1,52,0,62,2,60,3], //61
	[71,1,53,0,61,3], //62
	[72,1,54,0,64,2], //63
	[73,1,55,0,65,2,63,3], //64
	[74,1,56,0,66,2,64,3], //65
	[75,1,57,0,67,2,65,3], //66
	[76,1,58,0,68,2,66,3], //67
	[77,1,59,0,69,2,67,3], //68
	[78,1,60,0,70,2,68,3], //69
	[79,1,61,0,71,2,69,3], //70
	[80,1,62,0,70,3], //71
	[63,0,73,2], //72
	[64,0,74,2,72,3], //73
	[65,0,75,2,73,3], //74
	[66,0,76,2,74,3], //75
	[67,0,77,2,75,3], //76
	[68,0,78,2,76,3], //77
	[69,0,79,2,77,3], //78
	[70,0,80,2,78,3], //79
	[71,0,79,3], //80
];

const WALLS_BETWEEN = [ //[N wall1, N wall2][S wall 1, S wall 2][E wall1, E wall2][W wall1, W wall2]
	-1,-1,0,0,0,0,-1,-1, //0
	-1,-1,0,1,1,1,0,0, //1
	-1,-1,1,2,2,2,1,1, //2
	-1,-1,2,3,3,3,2,2, //3
	-1,-1,3,4,4,4,3,3, //4
	-1,-1,4,5,5,5,4,4, //5
	-1,-1,5,6,6,6,5,5, //6
	-1,-1,6,7,7,7,6,6, //7
	-1,-1,7,7,-1,-1,7,7, //8
	0,0,8,8,0,8,-1,-1, //9
	0,1,8,9,1,9,0,8, //10
	1,2,9,10,2,10,1,9, //11
	2,3,10,11,3,11,2,10, //12
	3,4,11,12,4,12,3,11, //13
	4,5,12,13,5,13,4,12, //14
	5,6,13,14,6,14,5,13, //15
	6,7,14,15,7,15,6,14, //16
	7,7,15,15,-1,-1,7,15, //17
	8,8,16,16,8,16,-1,-1, //18
	8,9,16,17,9,17,8,16, //19
	9,10,17,18,10,18,9,17, //20
	10,11,18,19,11,19,10,18, //21
	11,12,19,20,12,20,11,19, //22
	12,13,20,21,13,21,12,20, //23
	13,14,21,22,14,22,13,21, //24
	14,15,22,23,15,23,14,22, //25
	15,15,23,23,-1,-1,15,23, //26
	16,16,24,24,16,24,-1,-1, //27
	16,17,24,25,17,25,16,24, //28
	17,18,25,26,18,26,17,25, //29
	18,19,26,27,19,27,18,26, //30
	19,20,27,28,20,28,19,27, //31
	20,21,28,29,21,29,20,28, //32
	21,22,29,30,22,30,21,29, //33
	22,23,30,31,23,31,22,30, //34
	23,23,31,31,-1,-1,23,31, //35
	24,24,32,32,24,32,-1,-1, //36
	24,25,32,33,25,33,24,32, //37
	25,26,33,34,26,34,25,33, //38
	26,27,34,35,27,35,26,34, //39
	27,28,35,36,28,36,27,35, //40
	28,29,36,37,29,37,28,36, //41
	29,30,37,38,30,38,29,37, //42
	30,31,38,39,31,39,30,38, //43
	31,31,39,39,-1,-1,31,39, //44
	32,32,40,40,32,40,-1,-1, //45
	32,33,40,41,33,41,32,40, //46
	33,34,41,42,34,42,33,41, //47
	34,35,42,43,35,43,34,42, //48
	35,36,43,44,36,44,35,43, //49
	36,37,44,45,37,45,36,44, //50
	37,38,45,46,38,46,37,45, //51
	38,39,46,47,39,47,38,46, //52
	39,39,47,47,-1,-1,39,47, //53
	40,40,48,48,40,48,-1,-1, //54
	40,41,48,49,41,49,40,48, //55
	41,42,49,50,42,50,41,49, //56
	42,43,50,51,43,51,42,50, //57
	43,44,51,52,44,52,43,51, //58
	44,45,52,53,45,53,44,52, //59
	45,46,53,54,46,54,45,53, //60
	46,47,54,55,47,55,46,54, //61
	47,47,55,55,-1,-1,47,55, //62
	48,48,56,56,48,56,-1,-1, //63
	48,49,56,57,49,57,48,56, //64
	49,50,57,58,50,58,49,57, //65
	50,51,58,59,51,59,50,58, //66
	51,52,59,60,52,60,51,59, //67
	52,53,60,61,53,61,52,60, //68
	53,54,61,62,54,62,53,61, //69
	54,55,62,63,55,63,54,62, //70
	55,55,63,63,-1,-1,55,63, //71
	56,56,-1,-1,56,56,-1,-1, //72
	56,57,-1,-1,57,57,56,56, //73
	57,58,-1,-1,58,58,57,57, //74
	58,59,-1,-1,59,59,58,58, //75
	59,60,-1,-1,60,60,59,59, //76
	60,61,-1,-1,61,61,60,60, //77
	61,62,-1,-1,62,62,61,61, //78
	62,63,-1,-1,63,63,62,62, //79
	63,63,-1,-1,-1,-1,63,63, //80
];

const ADJACENT = [ //[H,H,V,V]
	1,1,8,8, //0
	0,2,9,9, //1
	1,3,10,10, //2
	2,4,11,11, //3
	3,5,12,12, //4
	4,6,13,13, //5
	5,7,14,14, //6
	6,6,15,15, //7
	9,9,0,16, //8
	8,10,1,17, //9
	9,11,2,18, //10
	10,12,3,19, //11
	11,13,4,20, //12
	12,14,5,21, //13
	13,15,6,22, //14
	14,14,7,23, //15
	17,17,8,24, //16
	16,18,9,25, //17
	17,19,10,26, //18
	18,20,11,27, //19
	19,21,12,28, //20
	20,22,13,29, //21
	21,23,14,30, //22
	22,22,15,31, //23
	25,25,16,32, //24
	24,26,17,33, //25
	25,27,18,34, //26
	26,28,19,35, //27
	27,29,20,36, //28
	28,30,21,37, //29
	29,31,22,38, //30
	30,30,23,39, //31
	33,33,24,40, //32
	32,34,25,41, //33
	33,35,26,42, //34
	34,36,27,43, //35
	35,37,28,44, //36
	36,38,29,45, //37
	37,39,30,46, //38
	38,38,31,47, //39
	41,41,32,48, //40
	40,42,33,49, //41
	41,43,34,50, //42
	42,44,35,51, //43
	43,45,36,52, //44
	44,46,37,53, //45
	45,47,38,54, //46
	46,46,39,55, //47
	49,49,40,56, //48
	48,50,41,57, //49
	49,51,42,58, //50
	50,52,43,59, //51
	51,53,44,60, //52
	52,54,45,61, //53
	53,55,46,62, //54
	54,54,47,63, //55
	57,57,48,48, //56
	56,58,49,49, //57
	57,59,50,50, //58
	58,60,51,51, //59
	59,61,52,52, //60
	60,62,53,53, //61
	61,63,54,54, //62
	62,62,55,55, //63
];



const SEARCH_DESTS_BY_PLAYER_POS = [ //PLAYER - [dir, destR, destPos]...
	[ //Player 1		
		[1,1,9,2,0,1], //0
		[1,1,10,3,0,0,2,0,2], //1
		[1,1,11,3,0,1,2,0,3], //2
		[1,1,12,3,0,2,2,0,4], //3
		[1,1,13,3,0,3,2,0,5], //4
		[1,1,14,3,0,4,2,0,6], //5
		[1,1,15,3,0,5,2,0,7], //6
		[1,1,16,3,0,6,2,0,8], //7
		[1,1,17,3,0,7], //8
		[1,2,18,2,1,10,0,0,0], //9
		[1,2,19,3,1,9,2,1,11,0,0,1], //10
		[1,2,20,3,1,10,2,1,12,0,0,2], //11
		[1,2,21,3,1,11,2,1,13,0,0,3], //12
		[1,2,22,3,1,12,2,1,14,0,0,4], //13
		[1,2,23,3,1,13,2,1,15,0,0,5], //14
		[1,2,24,3,1,14,2,1,16,0,0,6], //15
		[1,2,25,3,1,15,2,1,17,0,0,7], //16
		[1,2,26,3,1,16,0,0,8], //17
		[1,3,27,2,2,19,0,1,9], //18
		[1,3,28,3,2,18,2,2,20,0,1,10], //19
		[1,3,29,3,2,19,2,2,21,0,1,11], //20
		[1,3,30,3,2,20,2,2,22,0,1,12], //21
		[1,3,31,3,2,21,2,2,23,0,1,13], //22
		[1,3,32,3,2,22,2,2,24,0,1,14], //23
		[1,3,33,3,2,23,2,2,25,0,1,15], //24
		[1,3,34,3,2,24,2,2,26,0,1,16], //25
		[1,3,35,3,2,25,0,1,17], //26
		[1,4,36,2,3,28,0,2,18], //27
		[1,4,37,3,3,27,2,3,29,0,2,19], //28
		[1,4,38,3,3,28,2,3,30,0,2,20], //29
		[1,4,39,3,3,29,2,3,31,0,2,21], //30
		[1,4,40,3,3,30,2,3,32,0,2,22], //31
		[1,4,41,3,3,31,2,3,33,0,2,23], //32
		[1,4,42,3,3,32,2,3,34,0,2,24], //33
		[1,4,43,3,3,33,2,3,35,0,2,25], //34
		[1,4,44,3,3,34,0,2,26], //35
		[1,5,45,2,4,37,0,3,27], //36
		[1,5,46,3,4,36,2,4,38,0,3,28], //37
		[1,5,47,3,4,37,2,4,39,0,3,29], //38
		[1,5,48,3,4,38,2,4,40,0,3,30], //39
		[1,5,49,3,4,39,2,4,41,0,3,31], //40
		[1,5,50,3,4,40,2,4,42,0,3,32], //41
		[1,5,51,3,4,41,2,4,43,0,3,33], //42
		[1,5,52,3,4,42,2,4,44,0,3,34], //43
		[1,5,53,3,4,43,0,3,35], //44
		[1,6,54,2,5,46,0,4,36], //45
		[1,6,55,3,5,45,2,5,47,0,4,37], //46
		[1,6,56,3,5,46,2,5,48,0,4,38], //47
		[1,6,57,3,5,47,2,5,49,0,4,39], //48
		[1,6,58,3,5,48,2,5,50,0,4,40], //49
		[1,6,59,3,5,49,2,5,51,0,4,41], //50
		[1,6,60,3,5,50,2,5,52,0,4,42], //51
		[1,6,61,3,5,51,2,5,53,0,4,43], //52
		[1,6,62,3,5,52,0,4,44], //53
		[1,7,63,2,6,55,0,5,45], //54
		[1,7,64,3,6,54,2,6,56,0,5,46], //55
		[1,7,65,3,6,55,2,6,57,0,5,47], //56
		[1,7,66,3,6,56,2,6,58,0,5,48], //57
		[1,7,67,3,6,57,2,6,59,0,5,49], //58
		[1,7,68,3,6,58,2,6,60,0,5,50], //59
		[1,7,69,3,6,59,2,6,61,0,5,51], //60
		[1,7,70,3,6,60,2,6,62,0,5,52], //61
		[1,7,71,3,6,61,0,5,53], //62
		[1,8,72,2,7,64,0,6,54], //63
		[1,8,73,3,7,63,2,7,65,0,6,55], //64
		[1,8,74,3,7,64,2,7,66,0,6,56], //65
		[1,8,75,3,7,65,2,7,67,0,6,57], //66
		[1,8,76,3,7,66,2,7,68,0,6,58], //67
		[1,8,77,3,7,67,2,7,69,0,6,59], //68
		[1,8,78,3,7,68,2,7,70,0,6,60], //69
		[1,8,79,3,7,69,2,7,71,0,6,61], //70
		[1,8,80,3,7,70,0,6,62], //71
		[2,8,73,0,7,63], //72
		[3,8,72,2,8,74,0,7,64], //73
		[3,8,73,2,8,75,0,7,65], //74
		[3,8,74,2,8,76,0,7,66], //75
		[3,8,75,2,8,77,0,7,67], //76
		[3,8,76,2,8,78,0,7,68], //77
		[3,8,77,2,8,79,0,7,69], //78
		[3,8,78,2,8,80,0,7,70], //79
		[3,8,79,0,7,71], //80
	],
	[ //Player2
		[2,0,1,1,1,9], //0
		[2,0,2,3,0,0,1,1,10], //1
		[2,0,3,3,0,1,1,1,11], //2
		[2,0,4,3,0,2,1,1,12], //3
		[2,0,5,3,0,3,1,1,13], //4
		[2,0,6,3,0,4,1,1,14], //5
		[2,0,7,3,0,5,1,1,15], //6
		[2,0,8,3,0,6,1,1,16], //7
		[3,0,7,1,1,17], //8
		[0,0,0,2,1,10,1,2,18], //9
		[0,0,1,2,1,11,3,1,9,1,2,19], //10
		[0,0,2,2,1,12,3,1,10,1,2,20], //11
		[0,0,3,2,1,13,3,1,11,1,2,21], //12
		[0,0,4,2,1,14,3,1,12,1,2,22], //13
		[0,0,5,2,1,15,3,1,13,1,2,23], //14
		[0,0,6,2,1,16,3,1,14,1,2,24], //15
		[0,0,7,2,1,17,3,1,15,1,2,25], //16
		[0,0,8,3,1,16,1,2,26], //17
		[0,1,9,2,2,19,1,3,27], //18
		[0,1,10,2,2,20,3,2,18,1,3,28], //19
		[0,1,11,2,2,21,3,2,19,1,3,29], //20
		[0,1,12,2,2,22,3,2,20,1,3,30], //21
		[0,1,13,2,2,23,3,2,21,1,3,31], //22
		[0,1,14,2,2,24,3,2,22,1,3,32], //23
		[0,1,15,2,2,25,3,2,23,1,3,33], //24
		[0,1,16,2,2,26,3,2,24,1,3,34], //25
		[0,1,17,3,2,25,1,3,35], //26
		[0,2,18,2,3,28,1,4,36], //27
		[0,2,19,2,3,29,3,3,27,1,4,37], //28
		[0,2,20,2,3,30,3,3,28,1,4,38], //29
		[0,2,21,2,3,31,3,3,29,1,4,39], //30
		[0,2,22,2,3,32,3,3,30,1,4,40], //31
		[0,2,23,2,3,33,3,3,31,1,4,41], //32
		[0,2,24,2,3,34,3,3,32,1,4,42], //33
		[0,2,25,2,3,35,3,3,33,1,4,43], //34
		[0,2,26,3,3,34,1,4,44], //35
		[0,3,27,2,4,37,1,5,45], //36
		[0,3,28,2,4,38,3,4,36,1,5,46], //37
		[0,3,29,2,4,39,3,4,37,1,5,47], //38
		[0,3,30,2,4,40,3,4,38,1,5,48], //39
		[0,3,31,2,4,41,3,4,39,1,5,49], //40
		[0,3,32,2,4,42,3,4,40,1,5,50], //41
		[0,3,33,2,4,43,3,4,41,1,5,51], //42
		[0,3,34,2,4,44,3,4,42,1,5,52], //43
		[0,3,35,3,4,43,1,5,53], //44
		[0,4,36,2,5,46,1,6,54], //45
		[0,4,37,2,5,47,3,5,45,1,6,55], //46
		[0,4,38,2,5,48,3,5,46,1,6,56], //47
		[0,4,39,2,5,49,3,5,47,1,6,57], //48
		[0,4,40,2,5,50,3,5,48,1,6,58], //49
		[0,4,41,2,5,51,3,5,49,1,6,59], //50
		[0,4,42,2,5,52,3,5,50,1,6,60], //51
		[0,4,43,2,5,53,3,5,51,1,6,61], //52
		[0,4,44,3,5,52,1,6,62], //53
		[0,5,45,2,6,55,1,7,63], //54
		[0,5,46,2,6,56,3,6,54,1,7,64], //55
		[0,5,47,2,6,57,3,6,55,1,7,65], //56
		[0,5,48,2,6,58,3,6,56,1,7,66], //57
		[0,5,49,2,6,59,3,6,57,1,7,67], //58
		[0,5,50,2,6,60,3,6,58,1,7,68], //59
		[0,5,51,2,6,61,3,6,59,1,7,69], //60
		[0,5,52,2,6,62,3,6,60,1,7,70], //61
		[0,5,53,3,6,61,1,7,71], //62
		[0,6,54,2,7,64,1,8,72], //63
		[0,6,55,2,7,65,3,7,63,1,8,73], //64
		[0,6,56,2,7,66,3,7,64,1,8,74], //65
		[0,6,57,2,7,67,3,7,65,1,8,75], //66
		[0,6,58,2,7,68,3,7,66,1,8,76], //67
		[0,6,59,2,7,69,3,7,67,1,8,77], //68
		[0,6,60,2,7,70,3,7,68,1,8,78], //69
		[0,6,61,2,7,71,3,7,69,1,8,79], //70
		[0,6,62,3,7,70,1,8,80], //71
		[0,7,63,2,8,73], //72
		[0,7,64,2,8,74,3,8,72], //73
		[0,7,65,2,8,75,3,8,73], //74
		[0,7,66,2,8,76,3,8,74], //75
		[0,7,67,2,8,77,3,8,75], //76
		[0,7,68,2,8,78,3,8,76], //77
		[0,7,69,2,8,79,3,8,77], //78
		[0,7,70,2,8,80,3,8,78], //79
		[0,7,71,3,8,79], //80	
	]
];

const NEIGHBOR_WALLS = [ //[pos, wall-type][pos, wall-type]... (max of 10)
	[ //Horizontal
		[2,256,8,512,1,512,9,512,], //0
		[3,256,9,512,0,512,2,512,8,512,10,512,], //1
		[0,256,4,256,10,512,1,512,3,512,9,512,11,512,], //2
		[1,256,5,256,11,512,2,512,4,512,10,512,12,512,], //3
		[2,256,6,256,12,512,3,512,5,512,11,512,13,512,], //4
		[3,256,7,256,13,512,4,512,6,512,12,512,14,512,], //5
		[4,256,14,512,5,512,7,512,13,512,15,512,], //6
		[5,256,15,512,6,512,14,512,], //7
		[10,256,0,512,16,512,9,512,1,512,17,512,], //8
		[11,256,1,512,17,512,8,512,10,512,0,512,16,512,2,512,18,512,], //9
		[8,256,12,256,2,512,18,512,9,512,11,512,1,512,17,512,3,512,19,512,], //10
		[9,256,13,256,3,512,19,512,10,512,12,512,2,512,18,512,4,512,20,512,], //11
		[10,256,14,256,4,512,20,512,11,512,13,512,3,512,19,512,5,512,21,512,], //12
		[11,256,15,256,5,512,21,512,12,512,14,512,4,512,20,512,6,512,22,512,], //13
		[12,256,6,512,22,512,13,512,15,512,5,512,21,512,7,512,23,512,], //14
		[13,256,7,512,23,512,14,512,6,512,22,512,], //15
		[18,256,8,512,24,512,17,512,9,512,25,512,], //16
		[19,256,9,512,25,512,16,512,18,512,8,512,24,512,10,512,26,512,], //17
		[16,256,20,256,10,512,26,512,17,512,19,512,9,512,25,512,11,512,27,512,], //18
		[17,256,21,256,11,512,27,512,18,512,20,512,10,512,26,512,12,512,28,512,], //19
		[18,256,22,256,12,512,28,512,19,512,21,512,11,512,27,512,13,512,29,512,], //20
		[19,256,23,256,13,512,29,512,20,512,22,512,12,512,28,512,14,512,30,512,], //21
		[20,256,14,512,30,512,21,512,23,512,13,512,29,512,15,512,31,512,], //22
		[21,256,15,512,31,512,22,512,14,512,30,512,], //23
		[26,256,16,512,32,512,25,512,17,512,33,512,], //24
		[27,256,17,512,33,512,24,512,26,512,16,512,32,512,18,512,34,512,], //25
		[24,256,28,256,18,512,34,512,25,512,27,512,17,512,33,512,19,512,35,512,], //26
		[25,256,29,256,19,512,35,512,26,512,28,512,18,512,34,512,20,512,36,512,], //27
		[26,256,30,256,20,512,36,512,27,512,29,512,19,512,35,512,21,512,37,512,], //28
		[27,256,31,256,21,512,37,512,28,512,30,512,20,512,36,512,22,512,38,512,], //29
		[28,256,22,512,38,512,29,512,31,512,21,512,37,512,23,512,39,512,], //30
		[29,256,23,512,39,512,30,512,22,512,38,512,], //31
		[34,256,24,512,40,512,33,512,25,512,41,512,], //32
		[35,256,25,512,41,512,32,512,34,512,24,512,40,512,26,512,42,512,], //33
		[32,256,36,256,26,512,42,512,33,512,35,512,25,512,41,512,27,512,43,512,], //34
		[33,256,37,256,27,512,43,512,34,512,36,512,26,512,42,512,28,512,44,512,], //35
		[34,256,38,256,28,512,44,512,35,512,37,512,27,512,43,512,29,512,45,512,], //36
		[35,256,39,256,29,512,45,512,36,512,38,512,28,512,44,512,30,512,46,512,], //37
		[36,256,30,512,46,512,37,512,39,512,29,512,45,512,31,512,47,512,], //38
		[37,256,31,512,47,512,38,512,30,512,46,512,], //39
		[42,256,32,512,48,512,41,512,33,512,49,512,], //40
		[43,256,33,512,49,512,40,512,42,512,32,512,48,512,34,512,50,512,], //41
		[40,256,44,256,34,512,50,512,41,512,43,512,33,512,49,512,35,512,51,512,], //42
		[41,256,45,256,35,512,51,512,42,512,44,512,34,512,50,512,36,512,52,512,], //43
		[42,256,46,256,36,512,52,512,43,512,45,512,35,512,51,512,37,512,53,512,], //44
		[43,256,47,256,37,512,53,512,44,512,46,512,36,512,52,512,38,512,54,512,], //45
		[44,256,38,512,54,512,45,512,47,512,37,512,53,512,39,512,55,512,], //46
		[45,256,39,512,55,512,46,512,38,512,54,512,], //47
		[50,256,40,512,56,512,49,512,41,512,57,512,], //48
		[51,256,41,512,57,512,48,512,50,512,40,512,56,512,42,512,58,512,], //49
		[48,256,52,256,42,512,58,512,49,512,51,512,41,512,57,512,43,512,59,512,], //50
		[49,256,53,256,43,512,59,512,50,512,52,512,42,512,58,512,44,512,60,512,], //51
		[50,256,54,256,44,512,60,512,51,512,53,512,43,512,59,512,45,512,61,512,], //52
		[51,256,55,256,45,512,61,512,52,512,54,512,44,512,60,512,46,512,62,512,], //53
		[52,256,46,512,62,512,53,512,55,512,45,512,61,512,47,512,63,512,], //54
		[53,256,47,512,63,512,54,512,46,512,62,512,], //55
		[58,256,48,512,57,512,49,512,], //56
		[59,256,49,512,56,512,58,512,48,512,50,512,], //57
		[56,256,60,256,50,512,57,512,59,512,49,512,51,512,], //58
		[57,256,61,256,51,512,58,512,60,512,50,512,52,512,], //59
		[58,256,62,256,52,512,59,512,61,512,51,512,53,512,], //60
		[59,256,63,256,53,512,60,512,62,512,52,512,54,512,], //61
		[60,256,54,512,61,512,63,512,53,512,55,512,], //62
		[61,256,55,512,62,512,54,512,], //63
	],
	[ //Vertical
		[16,512,8,256,1,256,9,256,], //0
		[17,512,9,256,0,256,2,256,8,256,10,256,], //1
		[18,512,10,256,1,256,3,256,9,256,11,256,], //2
		[19,512,11,256,2,256,4,256,10,256,12,256,], //3
		[20,512,12,256,3,256,5,256,11,256,13,256,], //4
		[21,512,13,256,4,256,6,256,12,256,14,256,], //5
		[22,512,14,256,5,256,7,256,13,256,15,256,], //6
		[23,512,15,256,6,256,14,256,], //7
		[24,512,0,256,16,256,9,256,1,256,17,256,], //8
		[25,512,1,256,17,256,8,256,10,256,0,256,16,256,2,256,18,256,], //9
		[26,512,2,256,18,256,9,256,11,256,1,256,17,256,3,256,19,256,], //10
		[27,512,3,256,19,256,10,256,12,256,2,256,18,256,4,256,20,256,], //11
		[28,512,4,256,20,256,11,256,13,256,3,256,19,256,5,256,21,256,], //12
		[29,512,5,256,21,256,12,256,14,256,4,256,20,256,6,256,22,256,], //13
		[30,512,6,256,22,256,13,256,15,256,5,256,21,256,7,256,23,256,], //14
		[31,512,7,256,23,256,14,256,6,256,22,256,], //15
		[0,512,32,512,8,256,24,256,17,256,9,256,25,256,], //16
		[1,512,33,512,9,256,25,256,16,256,18,256,8,256,24,256,10,256,26,256,], //17
		[2,512,34,512,10,256,26,256,17,256,19,256,9,256,25,256,11,256,27,256,], //18
		[3,512,35,512,11,256,27,256,18,256,20,256,10,256,26,256,12,256,28,256,], //19
		[4,512,36,512,12,256,28,256,19,256,21,256,11,256,27,256,13,256,29,256,], //20
		[5,512,37,512,13,256,29,256,20,256,22,256,12,256,28,256,14,256,30,256,], //21
		[6,512,38,512,14,256,30,256,21,256,23,256,13,256,29,256,15,256,31,256,], //22
		[7,512,39,512,15,256,31,256,22,256,14,256,30,256,], //23
		[8,512,40,512,16,256,32,256,25,256,17,256,33,256,], //24
		[9,512,41,512,17,256,33,256,24,256,26,256,16,256,32,256,18,256,34,256,], //25
		[10,512,42,512,18,256,34,256,25,256,27,256,17,256,33,256,19,256,35,256,], //26
		[11,512,43,512,19,256,35,256,26,256,28,256,18,256,34,256,20,256,36,256,], //27
		[12,512,44,512,20,256,36,256,27,256,29,256,19,256,35,256,21,256,37,256,], //28
		[13,512,45,512,21,256,37,256,28,256,30,256,20,256,36,256,22,256,38,256,], //29
		[14,512,46,512,22,256,38,256,29,256,31,256,21,256,37,256,23,256,39,256,], //30
		[15,512,47,512,23,256,39,256,30,256,22,256,38,256,], //31
		[16,512,48,512,24,256,40,256,33,256,25,256,41,256,], //32
		[17,512,49,512,25,256,41,256,32,256,34,256,24,256,40,256,26,256,42,256,], //33
		[18,512,50,512,26,256,42,256,33,256,35,256,25,256,41,256,27,256,43,256,], //34
		[19,512,51,512,27,256,43,256,34,256,36,256,26,256,42,256,28,256,44,256,], //35
		[20,512,52,512,28,256,44,256,35,256,37,256,27,256,43,256,29,256,45,256,], //36
		[21,512,53,512,29,256,45,256,36,256,38,256,28,256,44,256,30,256,46,256,], //37
		[22,512,54,512,30,256,46,256,37,256,39,256,29,256,45,256,31,256,47,256,], //38
		[23,512,55,512,31,256,47,256,38,256,30,256,46,256,], //39
		[24,512,56,512,32,256,48,256,41,256,33,256,49,256,], //40
		[25,512,57,512,33,256,49,256,40,256,42,256,32,256,48,256,34,256,50,256,], //41
		[26,512,58,512,34,256,50,256,41,256,43,256,33,256,49,256,35,256,51,256,], //42
		[27,512,59,512,35,256,51,256,42,256,44,256,34,256,50,256,36,256,52,256,], //43
		[28,512,60,512,36,256,52,256,43,256,45,256,35,256,51,256,37,256,53,256,], //44
		[29,512,61,512,37,256,53,256,44,256,46,256,36,256,52,256,38,256,54,256,], //45
		[30,512,62,512,38,256,54,256,45,256,47,256,37,256,53,256,39,256,55,256,], //46
		[31,512,63,512,39,256,55,256,46,256,38,256,54,256,], //47
		[32,512,40,256,56,256,49,256,41,256,57,256,], //48
		[33,512,41,256,57,256,48,256,50,256,40,256,56,256,42,256,58,256,], //49
		[34,512,42,256,58,256,49,256,51,256,41,256,57,256,43,256,59,256,], //50
		[35,512,43,256,59,256,50,256,52,256,42,256,58,256,44,256,60,256,], //51
		[36,512,44,256,60,256,51,256,53,256,43,256,59,256,45,256,61,256,], //52
		[37,512,45,256,61,256,52,256,54,256,44,256,60,256,46,256,62,256,], //53
		[38,512,46,256,62,256,53,256,55,256,45,256,61,256,47,256,63,256,], //54
		[39,512,47,256,63,256,54,256,46,256,62,256,], //55
		[40,512,48,256,57,256,49,256,], //56
		[41,512,49,256,56,256,58,256,48,256,50,256,], //57
		[42,512,50,256,57,256,59,256,49,256,51,256,], //58
		[43,512,51,256,58,256,60,256,50,256,52,256,], //59
		[44,512,52,256,59,256,61,256,51,256,53,256,], //60
		[45,512,53,256,60,256,62,256,52,256,54,256,], //61
		[46,512,54,256,61,256,63,256,53,256,55,256,], //62
		[47,512,55,256,62,256,54,256,], //63
	]
];