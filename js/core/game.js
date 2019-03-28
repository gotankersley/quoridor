'use strict'
/*
#About: Class to manage players and events
*/
//Constants
const PLAYER_HUMAN = 0;
const PLAYER_RANDOM = 1;
const PLAYER_HEURISTIC = 2;
const PLAYER_THESEUS = 3;
const PLAYER_NETWORK = 4;
const PLAYER_ALPHABETA = 5;
const PLAYER_WASM = 6;
const PLAYER_MONTECARLO = 7;
const PLAYER_MCTS = 8;


const EVENT_INVALID = 0;
const EVENT_PLAYED = 1;
const EVENT_GAME_OVER = 2;
const EVENT_BOARD_UPDATE = 3;
const EVENT_SUGGEST = 4;
const EVENT_MESSAGE = 5;

const MODE_PLAY = 0;
const MODE_UNDO = 1;

//Class Game
function Game(boardStr) {
	this.board = new Board(boardStr); //The main (current) board instance		
	boardStr = this.board.toString(); //Update
	
	//Add initial state
	this.history = [boardStr]; //History is for game log
	this.memory = {}; //Memory is for detecting repeats
	this.memory[boardStr] = true;
	this.undoHistory = [];
	
	this.players = [PLAYER_HUMAN, PLAYER_HUMAN];
	
	this.gameEvents = {}; //Callbacks to update UI		
	this.suggesting = false;
	this.mode = MODE_PLAY;
}


Game.prototype.updateBoard = function(newBoard) {
	this.board = newBoard;
	this.gameEvents[EVENT_BOARD_UPDATE](newBoard);
}

//Event methods
Game.prototype.addEventListener = function(name, callback) {	
	this.gameEvents[name] = callback;
}


Game.prototype.onGameOver = function(winner) {
		
	//this.logCurrentState(boardCopy);
	
	//Draw the win and other hoopla...
	this.gameEvents[EVENT_GAME_OVER](winner, +(!winner));
		
}

Game.prototype.undoMove = function() {
	
	if (this.history.length > 1) {	
		var oldTurn = this.board.turn;
		var oldStr = this.history.pop();
		this.undoHistory.push(oldStr);
		delete this.memory[oldStr];
		var boardStr = this.history[this.history.length-1];
		
		this.board = new Board(boardStr);		
		this.board.turn = +(!oldTurn);		
		Url.setHash(boardStr);
		this.mode = MODE_UNDO;
		this.gameEvents[EVENT_BOARD_UPDATE](this.board);
		return true;		
	}
	return false;
}

Game.prototype.canHumanPlay = function() {
	if (this.players[this.board.turn] == PLAYER_HUMAN || this.mode == MODE_UNDO) return true;
	else return false;

}

Game.prototype.redoMove = function() {	
	if (this.undoHistory.length > 0) {	
		var oldTurn = this.board.turn;
		var savedStr = this.undoHistory.pop();
		this.history.push(savedStr);
		this.memory[savedStr] = true;
		this.board = new Board(savedStr);							
		this.board.turn = +(!oldTurn);
		Url.setHash(savedStr);
		
		//Check for Game over		
		if (this.board.isGameOver()) this.onGameOver(this.board.turn);	
		this.mode = MODE_UNDO;
		this.gameEvents[EVENT_BOARD_UPDATE](this.board);
		return true;
	}
	return false;
}



//Helper function keep track of game history
Game.prototype.logCurrentState = function(board) {
	var boardStr = board.toString();
	this.history.push(boardStr);

	this.memory[boardStr] = true;
}


//Player functions
Game.prototype.play = function() {
	
	var board = this.board;
	var turn = board.getTurn();
	var player = this.players[turn];
	
	if (player == PLAYER_HUMAN) return; //Ignore
	
	//Handle no-move, and one move
	//var moves = board.getMoves();	
	//if (moves.length == 0) throw new Error('No moves available');//return this.onPlayed();
	//else if (moves.length == 1) return this.onPlayed(moves[0]);
	
	
	//All Async - expect onPlayed callback	
	switch (player) {		
		case PLAYER_RANDOM: RandomPlayer.getPlay(board, this.onPlayed); break;	//Random		
		case PLAYER_HEURISTIC: HeuristicPlayer.getPlay(board, this.onPlayed); break; //Heuristic		
		case PLAYER_ALPHABETA: AlphaBetaPlayer.getPlay(board, this.onPlayed); break; //Minotaur
		case PLAYER_NETWORK: NetworkPlayer.getPlay(board, this.onPlayed); break; //Network		
		case PLAYER_THESEUS: TheseusPlayer.getPlay(board, this.onPlayed); break; //Theseus		
		case PLAYER_WASM: WasmPlayer.getPlay(board, this.onPlayed); break; //Wasm	
		case PLAYER_MONTECARLO: MonteCarloPlayer.getPlay(board, this.onPlayed); break; //MonteCarlo	
		case PLAYER_MCTS: MCTSPlayer.getPlay(board, this.onPlayed); break; //MCTS	
		default: alert('Invalid player');
	}		
}

Game.prototype.onPlayed = function(move) {
	var self = game;	
	self.mode = MODE_PLAY;			
	var board = self.board;	
	var turn = board.getTurn();
	var player = self.players[turn];
	
	var moveCode = board.makeMove(move);
	if (moveCode != VALID) return self.gameEvents[EVENT_INVALID]('', moveCode);	
	
	
	//History and Memory
	self.logCurrentState(board);	
	
	//Check for game over
	if (board.isGameOver()) self.onGameOver(board.turn);
	else {
		board.changeTurn();		
		self.gameEvents[EVENT_PLAYED](player, move, +(!board.turn));
	}
}

Game.prototype.onPlayerConfig = function(player) {
	if (this.players[player] == PLAYER_NETWORK) NetworkPlayer.configPlayer(player);
	else if (this.players[player] == PLAYER_RANDOM) RandomPlayer.configPlayer(player);
	else if (this.players[player] == PLAYER_THESEUS) TheseusPlayer.configPlayer(player);
			
}

Game.prototype.onSuggestMove = function() {
	var self = game;
	//if (!self.suggesting) {
	//	self.suggesting = true;
	//	var waiting = document.getElementById('suggestWaiting');
	//	var waitInterval = setInterval(function() {
	//		if (waiting.textContent.length >= 4) waiting.textContent = '';
	//		else waiting.textContent += '.';
	//		
	//		if (!self.suggesting) {
	//			waiting.textContent = '';
	//			clearInterval(waitInterval);
	//		}
	//	}, 500);
	//	var board = self.board;
	//	var turn = board.getTurn();
	//	var player = self.players[turn];
	//			
	//	
	//}
}

Game.prototype.sendMessage = function(msg) {
	this.gameEvents[EVENT_MESSAGE](msg);
}

Game.prototype.getPlayerName = function(player) {
	switch (player) {		
		case PLAYER_RANDOM: return 'Random'; 
		case PLAYER_HEURISTIC: return 'Heuristic';
		case PLAYER_ALPHABETA: return 'Minotaur';
		case PLAYER_NETWORK: return 'Network'; 
		case PLAYER_THESEUS: return 'Theseus'; 
		case PLAYER_WASM: return 'Wasm';
		case PLAYER_MONTECARLO: return 'MonteCarlo';
		case PLAYER_MCTS: return 'MCTS';
		default: return 'Unknown';
	}		
}

//end class Game
