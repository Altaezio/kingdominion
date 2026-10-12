const assert = require('node:assert/strict');
const test = require('node:test');
const simpleAttack = require('../source/modifier/action/simpleAttack.js');

function createArenaManager({ position = { x: 0, y: 0 }, random = () => 0 } = {}) {
    return {
        GetObjectPosition: () => position,
        Random: random,
    };
}

test('simple attack has the expected structure and requests visible enemies', () => {
    assert.equal(simpleAttack.id, 'simpleAttack');
    assert.equal(simpleAttack.type, 'action');
    assert.deepEqual(simpleAttack.tags, ['physical']);

    const info = {};
    simpleAttack.GatherWantedInfo(info);

    assert.deepEqual(info, { visibleEnemies: [] });
});

test('simple attack gathers its damage and reach values only when requested', () => {
    const info = { damage: undefined, reachMin: undefined, reachMax: undefined };

    simpleAttack.GatherInfo({}, 'attacker', {}, info);

    assert.deepEqual(info, { damage: 5, reachMin: 1, reachMax: 1 });
});

test('simple attack targets the closest in-range enemy without reordering visible enemies', () => {
    const nearest = { id: 'nearest', position: { x: 1, y: 0 } };
    const farther = { id: 'farther', position: { x: 0, y: 2 } };
    const visibleEnemies = [farther, nearest];
    const command = simpleAttack.GetCommand(
        {},
        'attacker',
        createArenaManager({ random: () => 0.85 }),
        { visibleEnemies },
    );

    assert.equal(command.type, 'actionCommand');
    assert.equal(command.modifierId, 'simpleAttack');
    assert.equal(command.weight, 100);
    assert.deepEqual(command.resultingEvent, {
        id: 'sendDamage',
        modifierId: 'simpleAttack',
        executor: 'attacker',
        author: 'attacker',
        targets: ['nearest'],
        amount: 5,
        reachMin: 1,
        reachMax: 1,
        isMissed: false,
    });
    assert.deepEqual(visibleEnemies, [farther, nearest]);
});

test('simple attack misses when the random roll exceeds its hit chance', () => {
    const command = simpleAttack.GetCommand(
        {},
        'attacker',
        createArenaManager({ random: () => 0.86 }),
        { visibleEnemies: [{ id: 'target', position: { x: 1, y: 0 } }] },
    );

    assert.equal(command.resultingEvent.isMissed, true);
});

test('simple attack moves away from an enemy closer than its minimum reach', () => {
    const command = simpleAttack.GetCommand(
        {},
        'attacker',
        createArenaManager(),
        { visibleEnemies: [{ id: 'target', position: { x: 0, y: 0 } }] },
    );

    assert.deepEqual(command, {
        id: 'moveAwayFromClosest',
        type: 'instruction',
        modifierId: 'simpleAttack',
        weight: 100,
        visibleEnemies: [{ id: 'target', position: { x: 0, y: 0 } }],
        reachMin: 1,
        reachMax: 1,
    });
});

test('simple attack moves toward the closest enemy beyond its maximum reach', () => {
    const farther = { id: 'farther', position: { x: 5, y: 0 } };
    const nearest = { id: 'nearest', position: { x: 0, y: 2 } };
    const visibleEnemies = [farther, nearest];
    const command = simpleAttack.GetCommand(
        {},
        'attacker',
        createArenaManager(),
        { visibleEnemies },
    );

    assert.equal(command.id, 'moveTowardsClosest');
    assert.equal(command.type, 'instruction');
    assert.equal(command.modifierId, 'simpleAttack');
    assert.equal(command.weight, 100);
    assert.equal(command.visibleEnemies, visibleEnemies);
    assert.equal(command.reachMin, 1);
    assert.equal(command.reachMax, 1);
});

test('simple attack returns no command when there are no visible enemies', () => {
    assert.equal(
        simpleAttack.GetCommand({}, 'attacker', createArenaManager(), { visibleEnemies: [] }),
        undefined,
    );
    assert.equal(
        simpleAttack.GetCommand({}, 'attacker', createArenaManager(), {}),
        undefined,
    );
});

test('simple attack applies event damage only for its successful executor action', () => {
    const fighter = { outOfCombat: false };
    const barrack = {
        GetFighterHolder: () => ({ allFighters: { attacker: fighter } }),
    };
    const event = {
        id: 'sendDamage',
        modifierId: 'simpleAttack',
        executor: 'attacker',
        author: 'attacker',
        targets: ['target'],
        amount: 5,
        reachMin: 1,
        reachMax: 1,
        timing: 'during',
        consequences: [],
    };

    simpleAttack.ProcessEvent(barrack, 'attacker', {}, event);

    assert.deepEqual(event.consequences, [{
        id: 'receiveDamage',
        modifierId: 'simpleAttack',
        executor: 'target',
        targets: ['target'],
        author: 'attacker',
        amount: 5,
        reachMin: 1,
        reachMax: 1,
        isMissed: undefined,
    }]);
});

test('simple attack ignores missed, unrelated, and out-of-combat events', () => {
    const fighter = { outOfCombat: false };
    const barrack = {
        GetFighterHolder: () => ({ allFighters: { attacker: fighter } }),
    };
    const baseEvent = {
        id: 'sendDamage',
        modifierId: 'simpleAttack',
        executor: 'attacker',
        targets: ['target'],
        amount: 5,
        timing: 'during',
        consequences: [],
    };
    const ignoredEvents = [
        { ...baseEvent, isMissed: true },
        { ...baseEvent, id: 'receiveDamage' },
        { ...baseEvent, modifierId: 'otherAttack' },
        { ...baseEvent, executor: 'otherFighter' },
        { ...baseEvent, timing: 'before' },
    ];

    for (const event of ignoredEvents)
        simpleAttack.ProcessEvent(barrack, 'attacker', {}, event);
    assert.ok(ignoredEvents.every(event => event.consequences.length === 0));

    fighter.outOfCombat = true;
    const event = { ...baseEvent, consequences: [] };
    simpleAttack.ProcessEvent(barrack, 'attacker', {}, event);
    assert.deepEqual(event.consequences, []);
});
