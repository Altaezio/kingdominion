const assert = require('node:assert/strict');
const test = require('node:test');
const lanceAttack = require('../source/modifier/action/lanceAttack.js');

test('lance attack hits one target up to two tiles away with reduced damage and accuracy', () => {
    const command = lanceAttack.GetCommand(
        {},
        'attacker',
        {
            GetObjectPosition: () => ({ x: 0, y: 0 }),
            Random: () => 0.8,
        },
        {
            visibleEnemies: [
                { id: 'target', position: { x: 2, y: 0 } },
                { id: 'far', position: { x: 3, y: 0 } },
            ],
        },
    );

    assert.equal(command.type, 'actionCommand');
    assert.deepEqual(command.resultingEvent.targets, ['target']);
    assert.equal(command.resultingEvent.amount, 4);
    assert.equal(command.resultingEvent.reachMin, 2);
    assert.equal(command.resultingEvent.reachMax, 2);
    assert.equal(command.resultingEvent.isMissed, true);
});

test('lance attack approaches enemies beyond its reach', () => {
    const command = lanceAttack.GetCommand(
        {},
        'attacker',
        { GetObjectPosition: () => ({ x: 0, y: 0 }) },
        { visibleEnemies: [{ id: 'far', position: { x: 3, y: 0 } }] },
    );

    assert.equal(command.type, 'instruction');
    assert.equal(command.reachMin, 2);
    assert.equal(command.reachMax, 2);
});
