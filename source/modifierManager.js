const fs = require('node:fs');
const path = require('node:path');
const tagManager = require('./tagManager.js');
const modifierLocalizations = require('./modifierLocalizations.js');

// ACTION are modifiers fighters can use to do something
// PASSIVE are modifiers always there
// MOVE are modifiers allowing a fighter to move

// only one ACTION or MOVE per turn

// ACTION create commands with a weight
// they can also create instructions that will serve to MOVE

// commands create events

// events are going through all the modifiers of the fighter before going through all the modifiers of the target of the event
// events have 2 timing : before, during
// events can have consequences as new events when finishing resolving
// these consequences will resolve before the next timing of the main event
// events are added and resolved as a stack

// the event itself should look if the author is outofcombat or not
// otherwise an event in the stack will resolve

// all events are passed through all fighters so they can react if they want
// the order is always the targets and then the others

module.exports = {
    loadedModifiers: undefined,

    LoadModifiers() {
        const modifierDirPath = path.join(__dirname, 'modifier');
        const modifierTypes = ['action', 'passive', 'move'];
        const modifiers = [];
        for (const type of modifierTypes) {
            const typeDirPath = path.join(modifierDirPath, type);
            if (!fs.existsSync(typeDirPath))
                continue;

            const modifierFiles = fs.readdirSync(typeDirPath).filter(file => file.endsWith('.js'));
            for (const file of modifierFiles) {
                const filePath = path.join(typeDirPath, file);
                const modifier = require(filePath);

                if (!modifier.hasOwnProperty('id')) {
                    console.warn(`The modifier at ${filePath} is missing an id`);
                    continue;
                }
                if (modifier.type !== type)
                    throw new Error(`Modifier ${modifier.id} has type '${modifier.type}' but is in the '${type}' directory`);
                modifiers.push(modifier);
            }
        }
        this.loadedModifiers = this.BuildModifierRegistry(modifiers);
    },

    BuildModifierRegistry(modifiers) {
        const registry = Object.create(null);
        for (const modifier of modifiers) {
            if (typeof modifier.id !== 'string' || modifier.id.length === 0)
                throw new Error('Modifier is missing a valid id');
            if (Object.prototype.hasOwnProperty.call(registry, modifier.id))
                throw new Error(`Duplicate modifier id: ${modifier.id}`);
            if (Object.prototype.hasOwnProperty.call(modifier, 'name'))
                throw new Error(`Modifier ${modifier.id} must not define a name`);
            if (Object.prototype.hasOwnProperty.call(modifier, 'description'))
                throw new Error(`Modifier ${modifier.id} must not define a description`);
            if (!['action', 'passive', 'move'].includes(modifier.type))
                throw new Error(`Modifier ${modifier.id} has an invalid type: ${modifier.type}`);

            tagManager.ValidateModifier(modifier);
            modifierLocalizations.ValidateModifierLocalization(modifier.id);
            registry[modifier.id] = modifier;
        }
        return registry;
    },

    GetModifiers() {
        if (this.loadedModifiers === undefined)
            this.LoadModifiers();
        return this.loadedModifiers;
    },

    GetModifier(id) {
        return this.GetModifiers()[id];
    },

    HasModifierTag(modifierId, tagId) {
        const modifier = this.GetModifier(modifierId);
        return modifier !== undefined && tagManager.HasTag(modifier.tags ?? [], tagId);
    },

    GetModifiersByTag(tagId) {
        return Object.values(this.GetModifiers()).filter(modifier =>
            tagManager.HasTag(modifier.tags ?? [], tagId)
        );
    }
}
