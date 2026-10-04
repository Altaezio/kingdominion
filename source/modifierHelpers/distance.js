function manhattanDistance(first, second) {
    return Math.abs(first.x - second.x) + Math.abs(first.y - second.y);
}

module.exports = { manhattanDistance };
