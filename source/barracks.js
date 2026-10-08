const fs = require('node:fs');
const guildData = require('./guildData.js');
const modifierPool = require('./modifierPool.js');
const loadedFighterHolders = new Map();

function getLoadedFighterHolder() {
    return loadedFighterHolders.get(guildData.getGuildId());
}

module.exports = {
    CreateFighter(name, icon, userLocalId, { modifierMode = 'random', modifierChoices = [] } = {}) {
        const fighterHolder = this.GetFighterHolder();
        const newFighter = {
            id: fighterHolder.nextId,
            type: 'fighter',
            name: name,
            icon: icon,
            userLocalId: userLocalId,
            baseModifierIds: modifierPool.GetNewFighterModifierIds(
                Object.keys(require('./modifierManager.js').GetModifiers()),
                { mode: modifierMode, choices: modifierChoices }
            ),
            baseModifierData: {},
            currentTeamId: 0,
            wins: 0,
            losses: 0,
        };
        fighterHolder.allFighters[newFighter.id] = newFighter;
        fighterHolder.nextId++;

        const modifierManager = require(`./modifierManager.js`);
        const modifiers = modifierManager.GetModifiers();
        newFighter.baseModifierIds.forEach(modId => {
            const mod = modifiers[modId];
            if (mod.hasOwnProperty('defaultData'))
                newFighter.baseModifierData[modId] = structuredClone(mod.defaultData);
        });

        const data = JSON.stringify(fighterHolder, null, 4);
        fs.writeFileSync(guildData.getFilePath('fighters.json'), data);
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
            .filter(fighter => fighter.userLocalId === userLocalId && !fighter.isRetired);
    },

    RetireFighter(fighterId) {
        const fighter = this.GetFighterById(fighterId);
        if (!fighter || fighter.isRetired)
            return false;

        fighter.isRetired = true;
        fighter.retiredAt = new Date().toISOString();
        this.SaveFighters();
        return true;
    },

    LoadAllFighters() {
        const fighterHolder = JSON.parse(fs.readFileSync(guildData.getFilePath('fighters.json'), 'utf8'));
        loadedFighterHolders.set(guildData.getGuildId(), fighterHolder);
        {
            const currentTime = new Date();
            console.log('[' + currentTime.toLocaleString('fr-FR') + `]: ${Object.keys(fighterHolder.allFighters).length} fighters loaded for guild ${guildData.getGuildId()}`);
        }
    },

    SaveFighters() {
        const fighterHolder = getLoadedFighterHolder();
        if (fighterHolder === undefined)
            return;

        const data = JSON.stringify(fighterHolder, null, 4);
        fs.writeFileSync(guildData.getFilePath('fighters.json'), data);
        {
            const currentTime = new Date();
            console.log('[' + currentTime.toLocaleString('fr-FR') + `]: Fighters saved`);
        }
    },

    AddModifierToFighter(fighterId, modifierId) {
        const fighter = this.GetFighterById(fighterId);
        if (fighter.baseModifierIds.includes(modifierId))
            return false;

        const modifierManager = require('./modifierManager.js');
        const modifier = modifierManager.GetModifier(modifierId);
        if (!modifier)
            return false;

        fighter.baseModifierIds.push(modifierId);
        if (modifier.defaultData)
            fighter.baseModifierData[modifierId] = structuredClone(modifier.defaultData);
        return true;
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
        const fighterHolder = getLoadedFighterHolder();
        if (fighterHolder === undefined)
            return JSON.parse(fs.readFileSync(guildData.getFilePath('fighters.json'), 'utf8'));
        return fighterHolder;
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
