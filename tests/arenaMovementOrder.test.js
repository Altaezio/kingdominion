const assert = require('node:assert/strict');
const test = require('node:test');
const arenaManager = require('../source/arenaManager.js');

function moveObject({ map, fighterData }, objectId, newPosition) {
    const arena = { map, fighterData };
    const originalGetArena = arenaManager.GetArena;
    arenaManager.GetArena = () => arena;

    try {
        arenaManager.MoveObject(objectId, newPosition);
    }
    finally {
        arenaManager.GetArena = originalGetArena;
    }

    return arena.map;
}

test('moving a fighter places active occupants before out-of-combat fighters', () => {
    const map = moveObject({
        map: {
            '0;0': [1],
            '1;0': [2, 3],
        },
        fighterData: {
            1: { isOutOfCombat: true },
            2: { isOutOfCombat: true },
            3: { isOutOfCombat: false },
        },
    }, 1, { x: 1, y: 0 });

    assert.deepEqual(map['1;0'], [3, 2, 1]);
    assert.equal(Object.hasOwn(map, '0;0'), false);
});

test('moving an active fighter ahead of downed occupants preserves their relative order', () => {
    const map = moveObject({
        map: {
            '0;0': [1],
            '1;0': [2, 3, 4],
        },
        fighterData: {
            1: { isOutOfCombat: false },
            2: { isOutOfCombat: true },
            3: { isOutOfCombat: false },
            4: { isOutOfCombat: true },
        },
    }, 1, { x: 1, y: 0 });

    assert.deepEqual(map['1;0'], [3, 1, 2, 4]);
});
