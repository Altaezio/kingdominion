const fs = require('node:fs');

module.exports = {
    loadedFighterHolder: undefined,

    CreateFighter(name, icon, userLocalId) {
        const fighterHolder = this.GetFighterHolder();
        const newFighter = {
            "id": fighterHolder.nextId,
            "type": "fighter",
            "name": name,
            "icon": icon,
            "userLocalId": userLocalId,
            "baseModifierIds": ['health', 'simpleAttack', 'simpleCrossMove'],
            "baseModifierData": {},
            "currentTeamId": 0,
            "wins": 0,
            "losses": 0,
        };
        fighterHolder.allFighters[newFighter.id] = newFighter;
        fighterHolder.nextId++;

        const modifierManager = require(`./modifierManager.js`);
        const modifiers = modifierManager.GetModifiers();
        newFighter.baseModifierIds.forEach(modId => {
            const mod = modifiers[modId];
            if (mod.hasOwnProperty('defaultData'))
                newFighter.baseModifierData[modId] = mod.defaultData;
        });

        const data = JSON.stringify(fighterHolder, null, 4);
        fs.writeFileSync('./data/fighters.json', data);
        {
            const currentTime = new Date();
            console.log('[' + currentTime.toLocaleString('fr-FR') + `]: New fighter created, name: ${name}, userLocalId: ${userLocalId}`);
        }
        return newFighter;
    },

    NameIsTaken(name) {
        const fighterHolder = this.GetFighterHolder();
        const fightersIds = Object.keys(fighterHolder.allFighters);
        const fighterId = fightersIds.find(id => fighterHolder.allFighters[id].name === name);
        return fighterId !== undefined;
    },

    GetFightersForUser(userLocalId) {
        const fighterHolder = this.GetFighterHolder();
        return Object.values(fighterHolder.allFighters)
            .filter(fighter => fighter.userLocalId === userLocalId);
    },

    LoadAllFighters() {
        const fighterHolder = JSON.parse(fs.readFileSync(`./data/fighters.json`, 'utf8'));
        this.loadedFighterHolder = fighterHolder;
        {
            const currentTime = new Date();
            console.log('[' + currentTime.toLocaleString('fr-FR') + `]: ${Object.keys(this.loadedFighterHolder.allFighters).length} fighters loaded`);
        }
    },

    SaveFighters() {
        if (this.loadedFighterHolder === undefined)
            return;

        const data = JSON.stringify(this.loadedFighterHolder, null, 4);
        fs.writeFileSync('./data/fighters.json', data);
        {
            const currentTime = new Date();
            console.log('[' + currentTime.toLocaleString('fr-FR') + `]: Fighters saved`);
        }
    },

    RecordMatchResult(participantIds, winningTeamId) {
        const fighterHolder = this.GetFighterHolder();
        participantIds.forEach(fighterId => {
            const fighter = fighterHolder.allFighters[fighterId];
            if (!fighter)
                return;

            if (fighter.currentTeamId === winningTeamId)
                fighter.wins++;
            else
                fighter.losses++;
        });
        this.SaveFighters();
    },

    GetFighterHolder() {
        if (this.loadedFighterHolder === undefined)
            return JSON.parse(fs.readFileSync(`./data/fighters.json`, 'utf8'));
        else
            return this.loadedFighterHolder;
    },

    GetFighterById(id) {
        const fighterHolder = this.GetFighterHolder();
        console.assert(fighterHolder.allFighters.hasOwnProperty(id), `Fighter with id ${id} not loaded`);
        return fighterHolder.allFighters[id];
    },

    GetFighterByName(name) {
        const fighterHolder = this.GetFighterHolder();
        const fightersIds = Object.keys(fighterHolder.allFighters);
        const fighterId = fightersIds.find(id => fighterHolder.allFighters[id].name === name);
        const fighter = fighterHolder.allFighters[fighterId]
        console.assert(fighter !== undefined, `Fighter ${name} not loaded`);
        return fighter;
    },

    GetFighterFullNameById(id) {
        return this.GetFighterFullName(this.GetFighterById(id));
    },

    GetFighterFullName(fighter) {
        if (fighter !== undefined) {
            return `${fighter.icon} ${fighter.name}`;
        }
    }
}
