const fs = require('node:fs');
const path = require('node:path');
const tagManager = require('./tagManager.js');

// ACTION are modifiers fighters can use to do something
// PASSIVE are modifiers always there
// MOVE are modifiers allowing a fighter to move

// only one ACTION or MOVE per turn

// ACTION create commands with a weight
// they can also create instructions that will serve to MOVE

// commands create events

// events are going through all the modifiers of the fighter before going through all the modifiers of the target of the event
// events have 3 timing : before, during
// events can have consequences as new events when finishing resolving
// these consequences will resolve before the next timing of the main event
// events are added and resolved as a stack

// the event itself should look if the author is outofcombat or not
// othewise an event in the stack will resolve

// all events are passed through all fighters so they can react if they want
// the order is always the target and then the others

module.exports = {
    loadedModifiers: undefined,

    LoadModifiers() {
        const modifierDirPath = path.join(__dirname, 'modifier');
        const modifierFiles = fs.readdirSync(modifierDirPath).filter(file => file.endsWith('.js'));
        this.loadedModifiers = {};
        for (const file of modifierFiles) {
            const filePath = path.join(modifierDirPath, file);
            const modifier = require(filePath);

            if (modifier.hasOwnProperty('id')) {
                tagManager.ValidateModifier(modifier);
                this.loadedModifiers[modifier.id] = modifier;
            } else {
                console.warn(`The modifier at ${filePath} is missing an id`);
            }
        }
    },

    GetModifiers() {
        if (this.loadedModifiers === undefined)
            this.LoadModifiers();
        return this.loadedModifiers;
    },

    GetModifier(id) {
        if (this.loadedModifiers !== undefined) {
            return this.loadedModifiers[id];
        }
        else {
            const modifierDirPath = path.join(__dirname, 'modifier');
            const modifierFiles = fs.readdirSync(modifierDirPath).filter(file => file.endsWith('.js'));
            for (const file of modifierFiles) {
                const filePath = path.join(modifierDirPath, file);
                const modifier = require(filePath);

                if (!modifier.hasOwnProperty('id')) {
                    console.warn(`The modifier at ${filePath} is missing an id`);
                } else if (modifier.id === id) {
                    return modifier;
                }
            }
        }
        console.error(`Modifier ${id} not found`);
        return undefined;
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
