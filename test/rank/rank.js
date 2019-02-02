//Constants
var POPULATION = 16;
var HALF_POP = POPULATION/2;
var rankAlg = 1;

class Team {
	constructor() {
		this.realVal = Math.floor(Math.random()*POPULATION);		
		this.total = 0;
		this.wins = 0;
		this.losses = 0;
	}
	
	fight(otherTeam) {
		this.total++;
		otherTeam.total++;
		
		//if (this.realVal == otherTeam.realVal) {
		//	this.wins++;
		//	otherTeam.wins++;
		// return true;
		//}
		if (this.realVal > otherTeam.realVal) {
			this.wins++;
			otherTeam.losses++;
			return true;
		}
		else {
			this.losses++;
			otherTeam.wins++;
			return false;
		}
		
		
	}
}

class Population {
	constructor() {
		this.pool = new Array(POPULATION);
		this.cost = 0;
		for (var p = 0; p < POPULATION; p++) {
			var team = new Team();
			this.pool[p] = team;
		}
	}
	
	rank() {
		this.cost = 0;
		if (rankAlg == 1) this.rank1(); //Everybody plays everybody once
		else if (rankAlg == 2) this.rank2(); //Binary
		else if (rankAlg == 4) this.rank4(); //Quaternary
		else if (rankAlg == 8) this.rank8(8); //Octonary
		else if (rankAlg == 5) this.rank5(4); //Rand 4 samples
		else if (rankAlg == 6) this.rank5(8); //Rand 8 samples			
		else if (rankAlg == 7) {
			var samples = prompt('How many samples?');
			this.rank5(samples); //Rand n samples		
		}
		else alert('Invalid rank algorithm');
	}	
	
	rank1() { //Play every other team once
		
		for (var r = 0; r < POPULATION; r++) {
			var team = this.pool[r];
			for (var c = r+1; c < POPULATION; c++) {
				var opp = this.pool[c];
				team.fight(opp);
				this.cost++;
			}
		}
	}
	
	
	rank2() { //Binary
		var cur = 0;
		var next = 1;
		var pools = [new Array(POPULATION), new Array(POPULATION)];
		
		var p = new Array(POPULATION);
		for (var p = 0; p < POPULATION; p++) {
			pools[cur][p] = p;
		}
		
		var partipants = POPULATION;
		for (var b = 0; b < Math.log2(POPULATION)+1; b++) {			
		
			var i = 0; 
			for (var p = 0; p < partipants; p+=2) {
				var index1 = pools[cur][p];
				var index2 = pools[cur][p+1]
				
				var team = this.pool[index1];
				var opp = this.pool[index2];
				
				
				var isWinner = team.fight(opp);
				if (isWinner) pools[next][i] = index1;
				else pools[next][i] = index2;
				
				this.cost++;
				i++;
			}
			partipants /= 2;//Could use shift
			cur = next;
			next = +(!next);
		}
	}
	
	rank3() { //triad rank
		for (var p = 0; p < HALF_POP; p++) {
			var team = this.pool[p];
			var opp1 = this.pool[(HALF_POP-1)+p];
			var opp2 = this.pool[(POPULATION-1)-p];
			
			team.fight(opp1);
			team.fight(opp2);
			this.cost+=2;
		}
	}

	rank4() { //Quatrinary
		const QUAD = 4;
		var cur = 0;
		var next = 1;
		var pools = [new Array(POPULATION), new Array(POPULATION)];
		
		var p = new Array(POPULATION);
		for (var p = 0; p < POPULATION; p++) {
			pools[cur][p] = p;
		}
				
		var luckyLosers = new Array(POPULATION);		
		var partipants = POPULATION;
		while (partipants >= QUAD) {
			var i = 0; 
			var division;
			var divisionScores;
			var luckyLosersCount = 0;
			for (var p = 0; p < partipants; p+=QUAD) {
				division = [
					pools[cur][p],
					pools[cur][p+1],
					pools[cur][p+2],
					pools[cur][p+3]
				];
				
				divisionScores = new Array(QUAD);
				
				//Play division matches
				for (var r = 0; r < QUAD; r++) {
					for (var c = r+1; c < QUAD; c++) {
						var index1 = division[r];
						var index2 = division[c];
						
						var team = this.pool[index1];
						var opp = this.pool[index2];
						
						var isWinner = team.fight(opp);
						if (isWinner) divisionScores[r]++;
						else divisionScores[c]++;
						this.cost++;
					}				
				}
				
				//Advance division winners
				for (var d = 0; d < QUAD; d++) {
					var score = divisionScores[d];
					if (score >= 2) pools[next][i++] = division[d];
					else luckyLosers[luckyLosersCount++] = division[d];
				}
							
			}
			var remainder = i % QUAD;
			if (remainder != 0) { //Lucky losers
				for (var r = 0; r < QUAD-remainder; r++) {
					pool[next][i++] = luckyLosers[Math.floor(Math.random()*luckyLosersCount)];
				}
			}
			partipants = i;
			cur = next;
			next = +(!next);
		}

	}
	
	rank8(DIV) { //Octinary
		if (!isPOT(POPULATION)) {
			alert('This algorithm requires population to be a power of 2');
			return this.rank4();
		}
		var cur = 0;
		var next = 1;
		var pools = [new Array(POPULATION), new Array(POPULATION)];
		
		var p = new Array(POPULATION);
		for (var p = 0; p < POPULATION; p++) {
			pools[cur][p] = p;
		}
				
		var luckyLosers = new Array(POPULATION);		
		var partipants = POPULATION;
		while (partipants >= DIV) {
			var i = 0; 
			var division;
			var divisionScores;
			var luckyLosersCount = 0;
			for (var p = 0; p < partipants; p+=DIV) {
				division = new Array(DIV);
				for (var d = 0; d < DIV; d++) {
					division[d] = pools[cur][p+d];
				}					
				
				divisionScores = new Array(DIV);
				
				//Play division matches
				for (var r = 0; r < DIV; r++) {
					for (var c = r+1; c < DIV; c++) {
						var index1 = division[r];
						var index2 = division[c];
						
						var team = this.pool[index1];
						var opp = this.pool[index2];
						
						var isWinner = team.fight(opp);
						if (isWinner) divisionScores[r]++;
						else divisionScores[c]++;
						this.cost++;
					}				
				}
				
				//Advance division winners
				for (var d = 0; d < DIV; d++) {
					var score = divisionScores[d];
					if (score >= (DIV/2)) pools[next][i++] = division[d];
					else luckyLosers[luckyLosersCount++] = division[d];
				}
							
			}
			var remainder = i % DIV;
			if (remainder != 0) { //Lucky losers
				for (var r = 0; r < DIV-remainder; r++) {
					pool[next][i++] = luckyLosers[Math.floor(Math.random()*luckyLosersCount)];
				}
			}
			partipants = i;
			cur = next;
			next = +(!next);
		}

	}

	rank5(samples) { //Rand		
		for (var p = 0; p < POPULATION; p++) {
			var team = this.pool[p];
			
			for (var s = 0; s < samples; s++) {
				var randIndex = Math.floor(Math.random() * POPULATION);
				if (randIndex == p) { //Repeat once
					randIndex = Math.floor(Math.random() * POPULATION);
					if (randIndex == p) continue;
				}
				
				var opp = this.pool[randIndex];
				team.fight(opp);
				this.cost++;
			}
		}
	}
	
	display() {
		document.write('<h3>Cost: ' + this.cost + '</h3>');
		document.write('<table id="info-table" border="1">');
		document.write('<tr>');
		document.write('<th>TID</th>');		
		document.write('<th>Total</th>');
		document.write('<th>Wins</th>');
		document.write('<th>Losses</th>');
		document.write('<th>Rank</th>');
		document.write('<th>Real</th>');
		document.write('</tr>');
		
		for (var p = 0; p < POPULATION; p++) {
			var team = this.pool[p];
			var rank = (team.wins/team.total)*100;//percent
			
			document.write('<tr>');
			
			document.write('<td>' + p + '</td>');	//TID	
			document.write('<td>' + team.total + '</td>'); //Total
			document.write('<td>' + team.wins + '</td>'); //Wins
			document.write('<td>' + team.losses + '</td>'); //Losses
			document.write('<td>' + rank + '</td>'); //Rank
			document.write('<td>' + team.realVal + '</td>'); //Real
			
			
			document.write('</td>');
			document.write('</tr>');
		}
		document.write('</table>');
	}
}

function onChangePopulation(val) {
	POPULATION = parseInt(val);
	run();

}

function onChangeRankAlg(val) {
	rankAlg = parseInt(val);
	run();
}

function isSelected(n) {
	if (rankAlg == n) return ' selected="selected"';
	else return '';
}

function isPOT(n) { //Power of 2
	if (typeof n !== 'number') 
		 return 'Not a number'; 
   
	   return n && (n & (n - 1)) === 0;
}

//Start
function run() {
	document.open(); //clear	
	document.write('<label>Population: ');
	document.write('<input onchange="onChangePopulation(this.value)" type="text" value="' + POPULATION + '" id="population" />');
	document.write('</label>');
	document.write('<button>Set</button>');
	document.write('<br/>');
	document.write('<label>Rank Algorithm: ');
	document.write('<select onchange="onChangeRankAlg(this.value)">');
	document.write('<option value="1"' + isSelected(1) + '>Play every other team once</option>');
	document.write('<option value="2"' + isSelected(2) + '>Brackets - Binary</option>');
	document.write('<option value="4"' + isSelected(4) + '>Brackets - Quaternary</option>');
	document.write('<option value="8"' + isSelected(8) + '>Brackets - Octonary</option>');
	document.write('<option value="5"' + isSelected(5) + '>Random - each plays 4 others</option>');
	document.write('<option value="6"' + isSelected(6) + '>Random - each plays 8 others</option>');
	document.write('<option value="7"' + isSelected(7) + '>Random - each plays N others</option>');
	document.write('</select>');
	document.write('</label>');	
	
	var population = new Population();
	population.rank();
	population.display();
	sorttable.makeSortable(document.getElementById('info-table'));
	
}


