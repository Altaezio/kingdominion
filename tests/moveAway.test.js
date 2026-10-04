const assert = require('node:assert/strict');
const test = require('node:test');
const simpleBishopMove = require('../source/modifier/move/simpleBishopMove.js');
const simpleCrossMove = require('../source/modifier/move/simpleCrossMove.js');

const fighterPosition = { x: 0, y: 0 };
const instruction = {
    id: 'moveAwayFromClosest',
    type: 'instruction',
    reachMin: 2,
    visibleEnemies: [{ id: 'enemy', position: { x: 1, y: 0 } }],
};
const arenaManager = { GetObjectPosition: () => fighterPosition };

test('cross movement can retreat from the closest enemy', () => {
    const commands = simpleCrossMove.GetCommand({}, 'fighter', arenaManager, {}, instruction);
    const directions = commands.map(command => command.resultingEvent.direction);

    assert.ok(directions.length > 0);
    assert.ok(!directions.includes('east'));
    assert.ok(directions.includes('west'));
    assert.ok(commands.every(command => command.resultingEvent.executor === 'fighter'));
});

test('bishop movement can retreat diagonally from the closest enemy', () => {
    const commands = simpleBishopMove.GetCommand({}, 'fighter', arenaManager, {}, instruction);
    const directions = commands.map(command => command.resultingEvent.direction);

    assert.ok(directions.length > 0);
    assert.ok(directions.every(direction => direction.includes('west')));
    assert.ok(commands.every(command => command.resultingEvent.executor === 'fighter'));
});

test('movement modifiers return no retreat commands without visible enemies', () => {
    const noEnemies = { ...instruction, visibleEnemies: [] };

    assert.equal(simpleCrossMove.GetCommand({}, 'fighter', arenaManager, {}, noEnemies), undefined);
    assert.equal(simpleBishopMove.GetCommand({}, 'fighter', arenaManager, {}, noEnemies), undefined);
});

test('movement modifiers gracefully handle a missing instruction', () => {
    assert.equal(simpleCrossMove.GetCommand({}, 'fighter', arenaManager, {}, undefined), undefined);
    assert.equal(simpleBishopMove.GetCommand({}, 'fighter', arenaManager, {}, undefined), undefined);
});
