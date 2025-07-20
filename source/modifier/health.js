const MAX_HEALTH = 10;

module.exports = {
    id: 'health',
    name: 'Vie',
    type: 'passive',
    description: 'Ce qui fait tenir debout',
    defaultData: {
        currentHealth: 10
    },

    GatherInfo(fighter, info) {
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

    ProcessEvent(fighter, event) {
        if (event.type == 'receiveDamage' && event.timing == 'actual') {
            console.assert(event.hasOwnProperty('amount'));
            if (event.amount > 0) {
                console.assert(fighter.modifierData.hasOwnProperty(this.id), `Fighter ${fighter.id} does not have health`);
                console.assert(fighter.modifierData[this.id].hasOwnProperty('maxHealth'), `Fighter ${fighter.id} does not have health maxHealth`);
                fighter.modifierData[this.id].currentHealth -= event.amount;
                event.log.push(`Le combatant ${fighter.name} a perdu ${event.amount} points de vie`);

                if (fighter.modifierData[this.id].currentHealth <= 0) {
                    const lostEvent = {
                        type: 'lose',
                        reason: 'notEnoughHealth'
                    };
                    event.consequence.push(lostEvent);
                }
            }
        }
    }
}
