module.exports = {
    CreateFighter(name, userLocalId) {
        const fighters = require('../data/fighters.json');
        const newFighter = {
            "id": fighters.nextId,
            "name": name,
            "userLocalId": userLocalId,
            "modifierIds": [],
            "modifierData": {}
        };
        fighters.allFighters[newFighter.id] = newFighter;
        fighters.nextId++;

        const data = JSON.stringify(fighters, null, 4);
        fs.writeFileSync('../data/fighters.json', data);
        {
            const currentTime = new Date();
            console.log('[' + currentTime.toLocaleString('fr-FR') + ']: New fighter created, name: ${name}, userLocalId: ${userLocalId}');
        }
        return newFighter;
    },

    GetFighters() {
        const fighters = require('../data/fighters.json');
        return fighters.allFighters;
    },

    GetFighterById(id) {
        const fighters = require('../data/fighters.json');
        console.assert(fighters.hasOwnProperty(id), 'Fighter with id ${id} not present in saved data');
        return fighters.allfighters[id];
    },

    GetFighterByName(name) {
        const fighters = require('../data/fighters.json');
        const fighter = fighters.allFighters.find(e => e.name === name);
        console.assert(fighter !== undefined, 'Fighter ${name} not present in saved data');
        return fighter;
    }
}
