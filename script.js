var board;
var game = new Chess();

// the "AI"
var calculateBestMove = function(possibleMoves) {
    var randomIndex = Math.floor(Math.random() * possibleMoves.length);

    return possibleMoves[randomIndex];
};

// do not pick up pieces if the game is over
// only pick up pieces for White
var onDragStart = function(source, piece, position, orientation) {
    if (game.in_checkmate() === true || game.in_draw() === true ||
        piece.search(/^b/) !== -1) {
        return false;
    }
};

var makeRandomMove = function() {
    var possibleMoves = game.moves();

    // game over
    if (possibleMoves.length === 0) return;

    var bestMove = calculateBestMove(possibleMoves);

    game.move(bestMove);
    board.position(game.fen());
};

var onDrop = function(source, target) {
    // see if the move is legal
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    });

    // illegal move
    if (move === null) return 'snapback';

    updateStatus();

    // make random legal move for black
    window.setTimeout(makeRandomMove, 250);
};

// update the board position after the piece snap
// for castling, en passant, pawn promotion
var onSnapEnd = function() {
    board.position(game.fen());
};

var updateStatus = function() {
    var status = '';

    var moveColor = 'White';
    if (game.turn() === 'b') {
        moveColor = 'Black';
    }

    // checkmate?
    if (game.in_checkmate() === true) {
        status = 'Game over, ' + moveColor + ' is in checkmate.';
    }

    // draw?
    else if (game.in_draw() === true) {
        status = 'Game over, drawn position';
    }

    // game still on
    else {
        status = moveColor + ' to move';

        // check?
        if (game.in_check() === true) {
            status += ', ' + moveColor + ' is in check';
        }
    }

    $('#status').html(status);
    $('#pgn').html(game.pgn());
};

var cfg = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
};

board = ChessBoard('board', cfg);
updateStatus();

$('#startBtn').on('click', function() {
    game.reset();
    board.start(true);
    updateStatus();
});