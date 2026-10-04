const assert = require('node:assert/strict');
const test = require('node:test');
const modifier = require('../source/modifier/move/dash.js');

test('dash has the expected modifier structure and starts ready', () => {
    assert.equal(modifier.id, 'dash');
    assert.equal(modifier.type, 'move');
    assert.deepEqual(modifier.defaultData, { cooldownTurnsRemaining: 0 });
    assert.equal(typeof modifier.GatherWantedInfo, 'function');
    assert.equal(typeof modifier.GatherInfo, 'function');
    assert.equal(typeof modifier.ProcessEvent, 'function');
    assert.equal(typeof modifier.GetCommand, 'function');
});

function createContext({ cooldownTurnsRemaining = 0, position = { x: 2, y: 2 } } = {}) {
    const modifierData = { cooldownTurnsRemaining };
    let currentPosition = { ...position };
    const arena = {
        fighterData: {
            fighter: {
                modifierData: { dash: modifierData },
            },
        },
    };
    const arenaManager = {
        GetArena: () => arena,
        GetObjectPosition: () => currentPosition,
        MoveObjectXY: (fighterId, x, y) => {
            currentPosition = { x, y };
        },
    };
    const barrack = {
        GetFighterHolder: () => ({
            allFighters: { fighter: { outOfCombat: false } },
        }),
    };
    return { modifierData, arenaManager, barrack, getPosition: () => currentPosition };
}

test('dash creates two-cell commands toward or away from the closest enemy when ready', () => {
    const { arenaManager } = createContext();
    const towards = modifier.GetCommand({}, 'fighter', arenaManager, {}, {
        id: 'moveTowardsClosest',
        type: 'instruction',
        visibleEnemies: [{ id: 'enemy', position: { x: 5, y: 2 } }],
    });
    const away = modifier.GetCommand({}, 'fighter', arenaManager, {}, {
        id: 'moveAwayFromClosest',
        type: 'instruction',
        visibleEnemies: [{ id: 'enemy', position: { x: 5, y: 2 } }],
    });

    assert.ok(towards.some(command =>
        command.resultingEvent.amount === 2 && command.resultingEvent.direction === 'east'
    ));
    assert.ok(away.some(command =>
        command.resultingEvent.amount === 2 && command.resultingEvent.direction === 'west'
    ));
});

test('dash movement sets a three-turn cooldown and moves two cells', () => {
    const { modifierData, arenaManager, barrack, getPosition } = createContext();

    modifier.ProcessEvent(barrack, 'fighter', arenaManager, {
        id: 'moveInDirection',
        modifierId: 'dash',
        executor: 'fighter',
        amount: 2,
        direction: 'north',
        timing: 'during',
    });

    assert.deepEqual(getPosition(), { x: 2, y: 4 });
    assert.equal(modifierData.cooldownTurnsRemaining, 3);
    assert.equal(modifier.GetCommand({}, 'fighter', arenaManager, {}, {
        id: 'moveTowardsClosest',
        type: 'instruction',
        visibleEnemies: [{ id: 'enemy', position: { x: 5, y: 4 } }],
    }), undefined);
});

test('dash cooldown decreases once on its executor beginning a turn', () => {
    const { modifierData, arenaManager, barrack } = createContext({ cooldownTurnsRemaining: 3 });

    modifier.ProcessEvent(barrack, 'fighter', arenaManager, {
        id: 'beginningOfYourTurn',
        executor: 'fighter',
        targets: [],
        timing: 'before',
    });
    assert.equal(modifierData.cooldownTurnsRemaining, 3);

    modifier.ProcessEvent(barrack, 'fighter', arenaManager, {
        id: 'beginningOfYourTurn',
        executor: 'fighter',
        targets: [],
        timing: 'during',
    });
    assert.equal(modifierData.cooldownTurnsRemaining, 2);

    modifier.ProcessEvent(barrack, 'fighter', arenaManager, {
        id: 'beginningOfYourTurn',
        executor: 'fighter',
        targets: [],
        timing: 'during',
    });
    assert.equal(modifierData.cooldownTurnsRemaining, 1);

    modifier.ProcessEvent(barrack, 'fighter', arenaManager, {
        id: 'beginningOfYourTurn',
        executor: 'fighter',
        targets: [],
        timing: 'during',
    });
    assert.equal(modifierData.cooldownTurnsRemaining, 0);
});
