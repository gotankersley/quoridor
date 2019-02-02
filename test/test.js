
var board;
var moveCode;

function runTests() {
        
    //Places
    placeWall();
    invalidPlace();

    //Moves
    validMoves();
    invalidMoves();

    //Jumps
    straightJumps();
    diagJumps();
    diagJumpsEdge();
}


function placeWall() {

}

function invalidPlace() {

}

    
function validMoves() {

}

function invalidMoves() {
    board = new Board('NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN2E810E110');
    moveCode = board.qmnMove('E3');
    assert(moveCode, INVALID_JUMP, 'Invalid dest');
}

function straightJumps() {
    board = new Board('NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN2E510E410');
    if (board.qmnMove('E6') != VALID) throw {msg:'Invalid Jump to E6', target:board.toString()};       
    assert(board.toString(), 'NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN1E510E610', 'Straight jump');

}

function diagJumps() {
    board = new Board('NNNNNNNNNNNNNNNNNNNHNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN1E510E409');
    if (board.qmnMove('F4') != VALID) throw {msg:'Invalid Diag to F4', target:board.toString()};       
    assert(board.toString(), 'NNNNNNNNNNNNNNNNNNNHNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN2F410E409', 'Diagonal jump');

    board = new Board('NNNNNNNNNNNNNNNNNNNNHNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN1E510E409');
    if (board.qmnMove('D4') != VALID) throw {msg:'Invalid Diag to D4', target:board.toString()};       
    assert(board.toString(), 'NNNNNNNNNNNNNNNNNNNNHNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN2D410E409', 'Diagonal jump');

    board = new Board('NNNNNNNNNNNNNNNNNNNNNNNNNNNNNVNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN1E410F409');
    if (board.qmnMove('F3') != VALID) throw {msg:'Invalid Diag to F3', target:board.toString()};         
    assert(board.toString(), 'NNNNNNNNNNNNNNNNNNNNNNNNNNNNNVNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN2F310F409', 'Diagonal jump');

    board = new Board('NNNNNNNNNNNNNNNNNNNNNVNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN1E410F409');
    if (board.qmnMove('F5') != VALID) throw {msg:'Invalid Diag to F5', target:board.toString()};       
    assert(board.toString(), 'NNNNNNNNNNNNNNNNNNNNNVNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN2F510F409', 'Diagonal jump');
}

function diagJumpsEdge() {
    board = new Board('NNNNNNNNNNNNNNNNNHVNNNNNNHNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN1B409A408');
    if (board.qmnMove('A3') != VALID) throw {msg:'Invalid Diag to A3', target:board.toString()};       
    assert(board.toString(), 'NNNNNNNNNNNNNNNNNHVNNNNNNHNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN2A309A408', 'Diagonal jump edge');

    board = new Board('NNNNNNNNNNNNNNNNNHVNNNNNNHNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN1B409A408');
    if (board.qmnMove('A5') != VALID) throw {msg:'Invalid Diag to A5', target:board.toString()};       
    assert(board.toString(), 'NNNNNNNNNNNNNNNNNHVNNNNNNHNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN2A509A408', 'Diagonal jump edge');

    board = new Board('VNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN1E210E109');
    if (board.qmnMove('D1') != VALID) throw {msg:'Invalid Diag to D1', target:board.toString()};       
    assert(board.toString(), 'VNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN2D110E109', 'Diagonal jump edge');

    board = new Board('VNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN1E210E109');
    if (board.qmnMove('F1') != VALID) throw {msg:'Invalid Diag to F1', target:board.toString()};       
    assert(board.toString(), 'VNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN2F110E109', 'Diagonal jump edge');
}