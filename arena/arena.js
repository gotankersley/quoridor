const QUORIDOR_LOAD_URL = '/quoridor/?load=';

//Globals				
var arena;
var game;
var menuManager; 
var	menu;
var resultsDiv;

const STATUS_VALID = 0;
const STATUS_INVALID = 1;
const STATUS_MOVE_LIMIT = 2;
const STATUS_EARLY_TERMINATION = 4;

class Arena {

    constructor(matches) {
        this.init(matches);
    }

    init = (matches) => {
        this.statuses = [];
        this.durations = [];        
        this.gamesPlayed = 0;
        this.players = [[game.players[PLAYER1], game.players[PLAYER2]]];
        this.matchStartTime = performance.now();
        this.matches = matches;
        this.moveCounts = [0];
        this.moves = [];
        this.running = true;
        this.winnerTurns = [];
        this.winnerPlayers = [];
        this.winDeltas = [];
        this.alternateStart = menu.alternateStart;
        this.moveStartTime = performance.now();
        this.avgTimes = [[0],[0]];        
    }

    start = () => {
        this.init(menu.matches);
        this.running = true;
        resultsDiv.innerHTML = '<h3>Running: ' + this.gamesPlayed + '/' + this.matches + '<a target="_blank" href="#" id="game-link">&rarr;</a></h3>';
        game.moves = [];
        game.board = new Board(menu.initialTQBN);        
        game.play();
        
    }
    
    stop = () => {
        this.running = false;
        this.display();
    }
   
    

    //Event callbacks
    onGameInvalid = (msg, code) => {
        var message = msg + getInvalidMessage(code);
        console.log(message);

        this.onGameOver(PLAYER1, PLAYER2, STATUS_INVALID);
    }

    onGamePlayed = (player, move, turn) => {        
        this.moveCounts[this.gamesPlayed]++;
        var gamesPlayed = this.gamesPlayed;

        if (this.moveCounts[gamesPlayed] > menu.moveLimit) {
            console.log('move limit reached');            
            this.onGameOver(PLAYER1, PLAYER2, STATUS_MOVE_LIMIT);             
        }
        else if (this.running) {
            var gameLink = document.getElementById('game-link');
            if (gameLink) gameLink.setAttribute('href', QUORIDOR_LOAD_URL + game.save());
            
            var self = this;
            setTimeout(function() {
                var moveDuration = performance.now() - self.moveStartTime;
            

                //Average move length                               
                self.avgTimes[turn][gamesPlayed] = (self.avgTimes[turn][gamesPlayed] + moveDuration)/2;                 
                self.moveStartTime = performance.now();

                if (menu.earlyTermination) {
                    var earlyTermination = game.canTerminateEarly();
                    if (earlyTermination == INVALID) game.play();
                    else self.onGameOver(earlyTermination, +(!earlyTermination), STATUS_EARLY_TERMINATION);
                }
                else game.play();

            }, 10);
        }    
    }



    onGameOver = (winner, loser, status) => {
        if (typeof(status) == 'undefined') this.statuses.push(STATUS_VALID);
        else this.statuses.push(status);

        //Actual winner
        var winnerTurn;
        var winnerPlayer;
        if (this.alternateStart) {
            if (this.gamesPlayed%2 == 0) {
                winnerTurn = winner;
                winnerPlayer = this.players[0][winner];
            }
            else {
                winnerTurn = loser;
                winnerPlayer = this.players[0][loser];
            }
        }
        else {
            winnerTurn = winner;
            winnerPlayer = this.players[0][winner];
        }

        this.winnerTurns.push(winnerTurn);
        this.winnerPlayers.push(winnerPlayer);

        //Move delta
        if (winner == PLAYER1) this.winDeltas.push(game.board.paths[PLAYER2].length);                    
        else  this.winDeltas.push(game.board.paths[PLAYER1].length);        

        this.moveStartTime = performance.now();
        this.avgTimes[PLAYER1].push(0);
        this.avgTimes[PLAYER2].push(0);

        this.moves.push(game.save());
        this.moveCounts.push(0);
        this.gamesPlayed++;
        this.durations.push(performance.now() - this.matchStartTime);    

        if (this.gamesPlayed < this.matches) { //Still running
            this.display();
            game.board = new Board(menu.initialTQBN);   
            game.moves = [];             
            if (this.alternateStart) game.swapPlayers();
                             
            this.players.push([game.players[PLAYER1], game.players[PLAYER2]]);
            this.matchStartTime = performance.now();
            game.play();
        }
        else {
            this.running = false;
            this.display();
        }
    }

    //Output
    display = () => { 
        var gamesPlayed = this.gamesPlayed;
        var gameLink = '<a target="_blank" href="#" id="game-link">&rarr;</a>';
        var output = '';
        if (this.running) output += '<h3>Running: ' + gamesPlayed + '/' + this.matches + gameLink + '</h3>';                    
        else output += '<h3>Done: ' + gamesPlayed + '/' + this.matches + gameLink + '</h3>';
    
        output += '<table id="info-table" border="1">';
        output += '<tr>';
        output += '<th>Game</th>';		
        output += '<th>Player1</th>';
        output += '<th>Player2</th>';
        output += '<th>Winner</th>';
        if (menu.showWinDelta) output += '<th>Win Delta</th>';
        if (menu.showMoveCount) output += '<th>Moves Made</th>';
        if (menu.showDuration) output += '<th>Duration</th>';
        if (menu.showAvgMoveTime) {
            output += '<th>Avg Move Time 1</th>';
            output += '<th>Avg Move Time 2</th>';
        }
        
        output += '</tr>';
        
        var totalWins = [0,0];        
    
        for (var g = 0; g < gamesPlayed; g++) {
    
            var duration = this.durations[g];            

            var winnerTurn = this.winnerTurns[g];
            
            var winnerPlayer = this.winnerPlayers[g];
            var winnerName = game.getPlayerName(winnerPlayer);

            var players = this.players[g];
            var player1 = players[PLAYER1];
            var player2 = players[PLAYER2];                                     
                       
            var name1 = game.getPlayerName(player1);
            var name2 = game.getPlayerName(player2);
            if (player1 == player2) {         
                winnerName += (winnerTurn + 1);
                if (this.alternateStart && g % 2 != 0) {
                    name1 += '2';
                    name2 += '1';
                }
                else {
                    name1 += '1';
                    name2 += '2';                                        
                }                
            }

            var status = this.statuses[g];
            if (status == STATUS_MOVE_LIMIT) winnerName = 'DNF: Move Limit';
            else if (status == STATUS_INVALID) winnerName = 'DNF: Invalid Move';
            //else if (status == STATUS_EARLY_TERMINATION) winnerName = 'EARLY: ' + winnerName;
            else totalWins[winnerTurn]++;
            
                        
            var moveCount = this.moveCounts[g];
    
            output += '<tr>';        
            output += '<td><a target="_blank" href="' + QUORIDOR_LOAD_URL + this.moves[g] + '">' + g + '</a></td>';	//Game	
            output += '<td>' + name1 + '</td>'; //Player1
            output += '<td>' + name2 + '</td>'; //Player2
            output += '<td>' + winnerName + '</td>'; //Wins        
            if (menu.showWinDelta) output += '<td>' + this.winDeltas[g] + '</td>'; //Duration MS       
            if (menu.showMoveCount) output += '<td>' + moveCount + '</td>'; //Move count        
            if (menu.showDuration) output += '<td>' + duration.toFixed(3) + '</td>'; //Duration MS       
            if (menu.showAvgMoveTime) {
                output += '<td>' + this.avgTimes[PLAYER1][g].toFixed(3) + '</td>'; //Avg move time1
                output += '<td>' + this.avgTimes[PLAYER2][g].toFixed(3) + '</td>'; //Avg move time2
            }
            
            output += '</td>';
            output += '</tr>';
        }
        output += '</table>';    

        var wins1 = totalWins[PLAYER1];
        var wins2 = totalWins[PLAYER2];        
        
        var name1 = game.getPlayerName(this.players[0][PLAYER1]);
        var name2 = game.getPlayerName(this.players[0][PLAYER2]);
        if (name1 == name2) {
            name1 += '1';
            name2 += '2';
        }

        output += '<h3>Overall winner: ';
        
        if (wins1 > wins2) output += name1 + ' - ' + wins1 + '/' + gamesPlayed;    
        else if (wins2 > wins1) output += name2 + ' - ' + wins2 + '/' + gamesPlayed;
        else output += 'tie - ' + wins1 + ':' + wins2;
        output += '</h3>';
    
    
        resultsDiv.innerHTML = output;
        sorttable.makeSortable(document.getElementById('info-table'));    
    }
}

function init() {
    
    menuManager = new MenuManager();
    menu = menuManager.properties;	
    resultsDiv = document.getElementById('results');
    game = new Game();		
    game.players = [parseInt(menu.player1), parseInt(menu.player2)];
    
    arena = new Arena(menu.matches);    

    //Game event callbacks
    game.addEventListener(EVENT_INVALID, arena.onGameInvalid);
    game.addEventListener(EVENT_GAME_OVER, arena.onGameOver);
    game.addEventListener(EVENT_PLAYED, arena.onGamePlayed);
    game.addEventListener(EVENT_MESSAGE, function(msg){ console.log(msg); });
    
    //Add Config options to initial player
    menuManager.onChangePlayer(menu.player1, 'player1');
    menuManager.onChangePlayer(menu.player2, 'player2');

    
}
init();