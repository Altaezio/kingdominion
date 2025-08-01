const MAX_HEALTH = 10;

module.exports = {
    id: 'health',
    name: 'Vie',
    type: 'passive',
    description: 'Ce qui fait tenir debout',
    defaultData: {
        currentHealth: 10
    },


    GatherWantedInfo(info) {
    },

    GatherInfo(barrack, fighterId, map, info) {
        let fighter = barrack.GetFighterById(fighterId);
        if (info.hasOwnProperty('currentHealth')) {
            console.assert(fighter.modifierData.hasOwnProperty(this.id), `Fighter ${fighter.id} does not have health`);
            console.assert(fighter.modifierData[this.id].hasOwnProperty('currentHealth'), `Fighter ${fighter.id} does not have health currentHealth`);
            info.currentHealth = fighter.modifierData[this.id].currentHealth;
        }
        if (info.hasOwnProperty('maxHealth')) {
            // console.assert(fighter.modifierData.hasOwnProperty(this.id), `Fighter ${fighter.id} does not have health`);
            // console.assert(fighter.modifierData[this.id].hasOwnProperty('maxHealth'), `Fighter ${fighter.id} does not have health maxHealth`);
            info.maxHealth = MAX_HEALTH;
        }
    },

    ProcessEvent(barrack, fighterId, map, event) {
        if (event.type === 'receiveDamage' && event.timing === 'during') {
            console.assert(event.hasOwnProperty('amount'));
            if (event.amount > 0) {
                let fighter = barrack.GetFighterById(fighterId);
                console.assert(fighter.modifierData.hasOwnProperty(this.id), `Fighter ${fighter.id} does not have health`);
                console.assert(fighter.modifierData[this.id].hasOwnProperty('maxHealth'), `Fighter ${fighter.id} does not have health maxHealth`);
                fighter.modifierData[this.id].currentHealth -= event.amount;
                event.log.push(`Le combatant ${fighter.name} a perdu ${event.amount} points de vie`);

                if (fighter.modifierData[this.id].currentHealth <= 0) {
                    const lostEvent = {
                        modifierId: this.id,
                        type: 'lose',
                        target: fighterId,
                        author: fighterId,
                        reason: 'notEnoughHealth',
                    };
                    event.consequence.push(lostEvent);
                }
            }
        }
    }
}
