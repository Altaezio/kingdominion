const { manhattanDistance } = require('./distance.js');

function findClosestEnemies(enemies, getDistance) {
    const candidates = enemies.map(enemy => ({ enemy, distance: getDistance(enemy) }));
    if (candidates.length === 0)
        return undefined;

    const distance = Math.min(...candidates.map(candidate => candidate.distance));
    return {
        distance,
        enemies: candidates
            .filter(candidate => candidate.distance === distance)
            .map(candidate => candidate.enemy),
    };
}

function createMoveCommand(modifierId, fighterId, direction, distance, destination) {
    return {
        type: 'moveCommand',
        modifierId,
        weight: -1,
        resultingEvent: {
            id: 'moveInDirection',
            modifierId,
            executor: fighterId,
            targets: [fighterId],
            author: fighterId,
            amount: 1,
            dist: distance,
            direction,
            ...(destination === undefined ? {} : { destination }),
        },
    };
}

module.exports = { findClosestEnemies, createMoveCommand, manhattanDistance };
