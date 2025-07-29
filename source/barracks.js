module.exports = {
    loadedFighters: {},

    CreateFighter(name, userLocalId) {
        const fighters = require('../data/fighters.json');
        const newFighter = {
            "id": fighters.nextId,
            "type": "fighter",
            "name": name,
            "userLocalId": userLocalId,
            "modifierIds": ['health', 'simpleAttack', 'simpleCrossMove'],
            "modifierData": {},
            "currentTeamId": 0
        };
        fighters.allFighters[newFighter.id] = newFighter;
        fighters.nextId++;

        const data = JSON.stringify(fighters, null, 4);
        fs.writeFileSync('../data/fighters.json', data);
        {
            const currentTime = new Date();
            console.log('[' + currentTime.toLocaleString('fr-FR') + `]: New fighter created, name: ${name}, userLocalId: ${userLocalId}`);
        }
        return newFighter;
    },

    LoadAllFighters() {
        const fighters = require('../data/fighters.json');
        this.loadedFighters = fighters.allFighters;
        {
            const currentTime = new Date();
            console.log('[' + currentTime.toLocaleString('fr-FR') + `]: ${length(Object.keys(this.LoadAllFighters))} fighters loaded`);
        }
    },

    SaveFighters() {
        const fighters = require('../data/fighters.json');
        for (let fighter in this.loadedFighters) {
            fighters[fighter.id] = fighter;
        }

        const data = JSON.stringify(fighters, null, 4);
        fs.writeFileSync('../data/fighters.json', data);
        {
            const currentTime = new Date();
            console.log('[' + currentTime.toLocaleString('fr-FR') + `]: Fighters saved`);
        }
    },

    GetFighters() {
        return this.loadedFighters;
    },

    GetFighterById(id) {
        console.assert(this.loadedFighters.hasOwnProperty(id), `Fighter with id ${id} not loaded`);
        return this.loadedFighters[id];
    },

    GetFighterByName(name) {
        const fighter = this.loadedFighters.find(e => e.name === name);
        console.assert(fighter !== undefined, `Fighter ${name} not loaded`);
        return fighter;
    }
}
