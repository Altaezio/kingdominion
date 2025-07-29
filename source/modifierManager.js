const fs = require('node:fs');
const path = require('node:path');

// ACTION are modifiers fighters can use to do something
// PASSIVE are modifiers always there
// MOVE are modifiers allowing a fighter to move

// only one ACTION or MOVE per turn

// ACTION create commands with a weight
// they can also create instructions that will serve to MOVE

// commands create events

// events are going through all the modifiers of the fighter before going through all the modifiers of the target of the event
// events have 3 timing : before, during, after
// events can have consequences as new events when finishing resolving

module.exports = {
    loadedModifiers: {},

    LoadModifiers() {
        const foldersPath = path.join(__dirname, 'source/modifier');
        const modifierFolders = fs.readdirSync(foldersPath);
        for (const folder of modifierFolders) {
            const modifiersPath = path.join(foldersPath, folder);
            const modifierFiles = fs.readdirSync(modifiersPath).filter(file => file.endsWith('.js'));
            for (const file of modifierFiles) {
                const filePath = path.join(modifiersPath, file);
                const modifier = require(filePath);

                if (modifier.hasOwnProperty('id')) {
                    this.loadedModifiers[modifier.id] = modifier;
                } else {
                    console.warn(`The modifier at ${filePath} is missing an id`);
                }
            }
        }
    }
}
