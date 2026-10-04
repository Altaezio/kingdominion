const assert = require('node:assert/strict');
const test = require('node:test');
const modifierManager = require('../source/modifierManager.js');
const modifierLocalizations = require('../source/modifierLocalizations.js');

test('all loaded modifiers have localized names and descriptions', () => {
    const modifiers = modifierManager.GetModifiers();

    for (const modifier of Object.values(modifiers)) {
        assert.equal(Object.hasOwn(modifier, 'name'), false, `${modifier.id} should not define a name`);
        assert.equal(Object.hasOwn(modifier, 'description'), false, `${modifier.id} should not define a description`);
        for (const language of ['fr', 'en']) {
            assert.ok(modifierLocalizations.GetName(modifier.id, language));
            assert.ok(modifierLocalizations.GetDescription(modifier.id, language));
        }
    }
});

test('modifier lookups load and use the validated registry', () => {
    modifierManager.loadedModifiers = undefined;

    const modifier = modifierManager.GetModifier('simpleAttack');

    assert.equal(modifier, modifierManager.GetModifiers().simpleAttack);
    assert.equal(modifierManager.GetModifier('missingModifier'), undefined);
});

test('duplicate modifier IDs are rejected', () => {
    const health = modifierManager.GetModifier('health');

    assert.throws(
        () => modifierManager.BuildModifierRegistry([health, { ...health }]),
        /Duplicate modifier id: health/,
    );
});

test('modifier definitions cannot reintroduce a name field', () => {
    const health = modifierManager.GetModifier('health');

    assert.throws(
        () => modifierManager.BuildModifierRegistry([{ ...health, name: 'Legacy name' }]),
        /Modifier health must not define a name/,
    );
});

test('modifier definitions cannot reintroduce a description field', () => {
    const health = modifierManager.GetModifier('health');

    assert.throws(
        () => modifierManager.BuildModifierRegistry([{ ...health, description: 'legacy text ID' }]),
        /Modifier health must not define a description/,
    );
});

test('missing modifier translations are rejected', () => {
    assert.throws(
        () => modifierLocalizations.ValidateModifierLocalization('missing'),
        /Missing modifier name localization: missing/,
    );

    assert.throws(
        () => modifierLocalizations.GetDescription('missing', 'en'),
        /Missing modifier description localization: missing/,
    );
});
