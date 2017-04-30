var board;
var game = new Chess();
var isCompVsComp = false;
var comp1Level = 1;
var comp2Level = 1;
var TIMEOUT = 250;

var randomMove = function(possibleMoves) {
    var randomIndex = Math.floor(Math.random() * possibleMoves.length);

    return possibleMoves[randomIndex];
};

var calculateBestMoveWithBoardEvaluation = function(possibleMoves) {
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

var calculateBestMoveWithMinimax = function(possibleMoves, depth) {
    var bestMoves = [];
    var bestValue = -999;

    for (var i = 0; i < possibleMoves.length; i++) {
        var newGameMove = possibleMoves[i];
        game.move(newGameMove);

        var boardValue = -minimax(game.moves(), +1, depth);
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

var minimax = function(possibleMoves, player, depth) {
    if (depth === 0) {
        return evaluateBoard(game.board());
    }

    var bestValue = -999;

    for (var i = 0; i < possibleMoves.length; i++) {
        var newGameMove = possibleMoves[i];
        game.move(newGameMove);
        console.log(game.ascii())

        var boardValue = minimax(game.moves(), -player, depth - 1);
        game.undo();

        if (boardValue > bestValue) {
            bestValue = boardValue;
        }
    }

    return bestValue;
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
    if (game.in_checkmate() || game.in_draw() ||
        piece.search(/^b/) !== -1) {
        return false;
    }
};

var makeComputerMove = function() {
    var possibleMoves = game.moves();

    // game over
    if (possibleMoves.length === 0) return;

    var bestMove;
    var compLevel = game.turn() === 'w' ? comp1Level : comp2Level;
    switch (parseInt(compLevel)) {
        case 1:
            bestMove = randomMove(possibleMoves);
            break;
        case 2:
            bestMove = calculateBestMoveWithBoardEvaluation(possibleMoves);
            break;
        case 3:
            bestMove = calculateBestMoveWithMinimax(possibleMoves, 1);
            break;
        case 4:
            bestMove = calculateBestMoveWithMinimax(possibleMoves, 2);
            break;
    }

    game.move(bestMove);
    board.position(game.fen());
    updateStatus();

    if (isCompVsComp && !game.in_checkmate() && !game.in_draw() && !game.in_stalemate()) {
        window.setTimeout(makeComputerMove, TIMEOUT);
    } else if (isCompVsComp && $('#autoplay').is(':checked')) {
        newGame();
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
    window.setTimeout(makeComputerMove, TIMEOUT);
};

// update the board position after the piece snap
// for castling, en passant, pawn promotion
var onSnapEnd = function() {
    board.position(game.fen());
};

var updateStatus = function() {
    var status = '';
    var counterId;

    var moveColor = game.turn() === 'w' ? 'White' : 'Black';

    if (game.in_checkmate()) {
        status = 'Game over, ' + moveColor + ' is in checkmate.';
        counterId = game.turn() === 'w' ? '#blackWins' : '#whiteWins';
    } else if (game.in_stalemate()) {
        status = 'Game over, stalemate';
        counterId = '#draws';
    } else if (game.in_draw()) {
        status = 'Game over, drawn position';
        counterId = '#draws';
    } else {
        status = moveColor + ' to move';

        if (game.in_check() === true) {
            status += ', ' + moveColor + ' is in check';
        }
    }

    $('#status').html(status);
    $('#pgn').html(game.pgn());

    var newCounter =  parseInt($(counterId).html()) + 1;
    $(counterId).html(newCounter);
};

var newGame = function() {
    game.reset();
    board.start(true);
    updateStatus();

    isCompVsComp = $('input[name="gameType"]:checked').val() === 'compVsComp';
    comp1Level = $('input[name="comp1Level"]:checked').val();
    comp2Level = $('input[name="comp2Level"]:checked').val();

    if (isCompVsComp) {
        window.setTimeout(makeComputerMove, TIMEOUT);
    }
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

$('#newGame').on('click', newGame);

$('input[name="gameType"]').on('click', function(event) {
    if (event.currentTarget.value === 'compVsComp') {
        $('#comp1Level').show();
    } else {
        $('#comp1Level').hide();
    }
});