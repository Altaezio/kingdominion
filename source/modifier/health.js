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

    GatherInfo(barrack, fighterId, arena, info) {
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

    ProcessEvent(barrack, fighterId, arena, event) {
        if (event.type === 'receiveDamage' && event.timing === 'during' && event.target === fighterId) {
            console.assert(event.hasOwnProperty('amount'));
            let doTakeDamage = event.amount > 0;
            if (doTakeDamage && event.hasOwnProperty('isMissed'))
                doTakeDamage = event.isMissed;

            if (doTakeDamage) {
                let fighter = barrack.GetFighterById(fighterId);
                console.assert(fighter.modifierData.hasOwnProperty(this.id), `Fighter ${fighter.id} does not have health`);
                console.assert(fighter.modifierData[this.id].hasOwnProperty('maxHealth'), `Fighter ${fighter.id} does not have health maxHealth`);
                fighter.modifierData[this.id].currentHealth -= event.amount;
                // event.log.push(`Le combatant ${fighter.name} a perdu ${event.amount} points de vie`);

                if (fighter.modifierData[this.id].currentHealth <= 0) {
                    const lostEvent = {
                        modifierId: this.id,
                        type: 'outOfCombat',
                        target: fighterId,
                        author: fighterId,
                        reason: 'notEnoughHealth',
                    };
                    event.consequences.push(lostEvent);
                }
            }
        }
        else if (event.type === 'outOfCombat' && event.timing === 'during' && event.target === fighterId) {
            let fighter = barrack.GetFighterById(fighterId);
            fighter.isOutOfCombat = true;
        }
    }
}
