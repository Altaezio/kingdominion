const assert = require('node:assert/strict');
const test = require('node:test');
const spinAttack = require('../source/modifier/action/spinAttack.js');
const simpleAttack = require('../source/modifier/action/simpleAttack.js');
const bowShoot = require('../source/modifier/action/bowShoot.js');

test('single-target actions express their target as a one-element array', () => {
    const arenaManager = {
        GetObjectPosition: () => ({ x: 0, y: 0 }),
        Random: () => 0,
    };
    const visibleEnemy = { id: 'target', position: { x: 1, y: 0 } };
    const meleeCommand = simpleAttack.GetCommand({}, 'attacker', arenaManager, {
        visibleEnemies: [visibleEnemy],
    });
    const rangedCommand = bowShoot.GetCommand({}, 'attacker', arenaManager, {
        visibleEnemies: [{ ...visibleEnemy, position: { x: 2, y: 0 } }],
    });

    for (const command of [meleeCommand, rangedCommand]) {
        assert.equal(command.resultingEvent.executor, 'attacker');
        assert.deepEqual(command.resultingEvent.targets, ['target']);
        assert.ok(Object.hasOwn(command.resultingEvent, 'reachMin'));
        assert.ok(Object.hasOwn(command.resultingEvent, 'reachMax'));
        assert.equal(Object.hasOwn(command.resultingEvent, 'target'), false);
        assert.equal(Object.hasOwn(command.resultingEvent, 'finalTarget'), false);
        assert.equal(Object.hasOwn(command.resultingEvent, 'minDist'), false);
        assert.equal(Object.hasOwn(command.resultingEvent, 'distMin'), false);
    }
});

test('spin attack targets every visible enemy in the surrounding eight tiles', () => {
    const command = spinAttack.GetCommand(
        {},
        'attacker',
        {
            GetObjectPosition: () => ({ x: 0, y: 0 }),
            Random: () => 0,
        },
        {
            visibleEnemies: [
                { id: 'north', position: { x: 0, y: -1 } },
                { id: 'east', position: { x: 1, y: 0 } },
                { id: 'diagonal', position: { x: 1, y: 1 } },
                { id: 'far', position: { x: 0, y: 2 } },
            ],
        },
    );

    assert.equal(command.type, 'actionCommand');
    assert.deepEqual(command.resultingEvent.targets, ['north', 'east', 'diagonal']);
    assert.equal(command.resultingEvent.amount, 3);
    assert.equal(command.resultingEvent.reachMin, 1);
    assert.equal(command.resultingEvent.reachMax, 1);
});

test('spin attack executor can differ from the author and damage each target', () => {
    const event = {
        id: 'sendDamage',
        modifierId: 'spinAttack',
        executor: 'executor',
        author: 'author',
        targets: ['north', 'east', 'diagonal'],
        amount: 3,
        timing: 'during',
        consequences: [],
    };
    const barrack = {
        GetFighterHolder: () => ({
            allFighters: { executor: { outOfCombat: false } },
        }),
    };

    spinAttack.ProcessEvent(barrack, 'executor', {}, event);

    assert.deepEqual(
        event.consequences.map(consequence => consequence.targets[0]),
        ['north', 'east', 'diagonal'],
    );
    assert.ok(event.consequences.every(consequence => consequence.amount === 3));
    assert.ok(event.consequences.every(consequence => consequence.author === 'author'));
});
