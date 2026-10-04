const assert = require('node:assert/strict');
const test = require('node:test');
const { ValidateEvent } = require('../source/eventUtils.js');

test('event validation requires an id and never treats type as the id', () => {
    assert.throws(
        () => ValidateEvent({ type: 'sendDamage' }),
        { name: 'TypeError', message: 'Event must have a non-empty string id' },
    );
});

test('event validation accepts id without type and defaults targets to an empty array', () => {
    const event = ValidateEvent({ id: 'beginningOfYourTurn' });

    assert.deepEqual(event.targets, []);
    assert.equal(Object.hasOwn(event, 'type'), false);
});

test('event validation rejects malformed IDs and targets', () => {
    assert.throws(() => ValidateEvent({ id: '' }), /non-empty string id/);
    assert.throws(() => ValidateEvent({ id: 'valid', targets: 'fighter' }), /targets array/);
});
