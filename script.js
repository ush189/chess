var board;
var game = new Chess();
var isCompVsComp = false;

// the "AI"
var calculateBestMove = function(possibleMoves) {

    var bestMoves = [];
    var bestValue = -999;

    for (var i = 0; i < possibleMoves.length; i++) {
        var newGameMove = possibleMoves[i];
        game.move(newGameMove);

        var boardValue = evaluateBoard(game.board());
        game.undo();

        if (boardValue > bestValue) {
            bestValue = boardValue;
            bestMoves = [newGameMove];
        } else if (boardValue === bestValue) {
            bestMoves.push(newGameMove);
        }
    }

    var randomIndex = Math.floor(Math.random() * bestMoves.length);

    return bestMoves[randomIndex];
};

var evaluateBoard = function(board) {
    var totalEvaluation = 0;
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            totalEvaluation = totalEvaluation + getPieceValue(board[i][j]);
        }
    }

    return totalEvaluation;
};

var getPieceValue = function (piece) {
    if (piece === null) {
        return 0;
    }
    var getAbsoluteValue = function (piece) {
        if (piece.type === 'p') {
            return 1;
        } else if (piece.type === 'r') {
            return 5;
        } else if (piece.type === 'n') {
            return 3;
        } else if (piece.type === 'b') {
            return 3 ;
        } else if (piece.type === 'q') {
            return 9;
        } else if (piece.type === 'k') {
            return 100;
        }
        throw "Unknown piece type: " + piece.type;
    };

    var absoluteValue = getAbsoluteValue(piece);

    // we are one move ahead, so it needs to be !game.turn()
    return piece.color !== game.turn() ? absoluteValue : -absoluteValue;
};

// do not pick up pieces if the game is over
// only pick up pieces for White
var onDragStart = function(source, piece, position, orientation) {
    if (game.in_checkmate() === true || game.in_draw() === true ||
        piece.search(/^b/) !== -1) {
        return false;
    }
};

var makeComputerMove = function() {
    var possibleMoves = game.moves();

    // game over
    if (possibleMoves.length === 0) return;

    var bestMove = calculateBestMove(possibleMoves);

    game.move(bestMove);
    board.position(game.fen());
    updateStatus();

    if (isCompVsComp) {
        window.setTimeout(makeComputerMove, 250);
    }
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
    window.setTimeout(makeComputerMove, 250);
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

$('#newGame').on('click', function() {
    game.reset();
    board.start(true);
    updateStatus();

    isCompVsComp = $('input[name="gameType"]:checked').val() === 'compVsComp';

    if (isCompVsComp) {
        window.setTimeout(makeComputerMove, 250);
    }
});