const WEIGHTS = 2;
const WEIGHT_RANGE = 10;
class Team {
	constructor() {
		this.weights = new Array(WEIGHTS);
		this.total = 0;
		this.wins = 0;
	}

	play(otherTeam) { 
		this.total++;
		otherTeam.total++;
		
		var board = new board();
		//Play game
		var winner = true;

		//Ties 
		//if (winner == otherTeam.realVal) {
		//	this.wins += 0.5;
		//	otherTeam.wins += 0.5;
		// return true;
		//}
		if (winner) {
			this.wins++;						
		}
		else {						
			return false;
		}
	}

	combine(team1, team2) { //Perhaps we could use a trade metaphor?
		for (var w = 0; w < this.weights.length; w++) {
			//Maybe Mutate
			var mutateProbability = Math.random(); //Range [0.0,1.0] exclusive?
			if (mutateProbability <= MUTATION_RATE) { 				
				this.weights[w] = WEIGHT_RANGE-(Math.random()*(2*WEIGHT_RANGE));
				
			}
			//Combine both
			else {	
				var team = (Math.floor(Math.random()) % 2 == 0)? team1 : team2;
				this.weights[w] = team.weights[w];
			}
		}
	}

	getRank() {
		return this.wins/this.total;
	}
}