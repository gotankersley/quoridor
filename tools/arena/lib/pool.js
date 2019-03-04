const SAMPLES = 4;
const POPULATION = 100;
const TOURNAMENT_SIZE = 20;
const GENERATIONS = 10;
const MUTATION_RATE = 0.1;
const NUM_ELITES = POPULATION/10;

class Pool {
	constructor(){ 

		this.pool = [new Array(POPULATION), new Array(POPULATION)];
		this.elites = new Array(NUM_ELITES);		
		this.cur = 0;
		
		for (var p = 0; p < POPULATION; p++) {
			var team = new Team();
			this.pool[this.cur][p] = team;
		}
	}

	rankTeams() { //Determine fitness - Rand ranking algorithm		
		for (var p = 0; p < POPULATION; p++) {
			var team = this.pool[p];
			
			for (var s = 0; s < SAMPLES; s++) {
				var randIndex = Math.floor(Math.random() * POPULATION);
				if (randIndex == p) { //Repeat once
					randIndex = Math.floor(Math.random() * POPULATION);
					if (randIndex == p) continue;
				}
				
				var opp = this.pool[randIndex];
				team.play(opp);				
			}
		}
	}

	evolveStep() {
		//Evaluate - rank all teams	
		this.rankTeams();

		//Fill up the next pool by combining parents			
		populateNext();					

		//Save			

		//Swap current pool with next pool
		this.cur = +(!this.cur);
	}
		
	evolveLoop() {
		for (var g = 0; g < GENERATIONS; g++) {		
			evolveStep();				
		}
	}

	populateNext() {
		//Pre-promote elite		
		var nextPool = +(!this.cur);				
		for (var p = NUM_ELITES; p < POPULATION; p++) { //Pre-promote elite		

			//Select parents (Tournament style)
			var team1 = this.tournamentSelect();
			var team2 = this.tournamentSelect();		
			var newTeam = this.pools[nextPool][p]; //Save a bit o' memory
			newTeam = newTeam.combine(team1, team2); 		
			
			
		}	
	}

	tournamentSelect() {
		//Use tournament style selection
		var bestRank = 0;
		var bestIndex;
		for (var t = 0; t < TOURNAMENT_SIZE; t++) {
			var randIndex = Math.floor(Math.random() * POPULATION);
			var rank = pools[this.cur][randIndex].getRank();
			if (rank > bestRank) {
				bestRank = rank;
				bestIndex = randIndex;
			}
		}
		return pools[this.cur][bestIndex];
	}

	save() {
		//TODO:Node .js service?
		for (var p = 0; p < POPULATION; p++) {
			
		}
	}

	load() {

	}
}