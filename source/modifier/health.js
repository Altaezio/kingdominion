const MAX_HEALTH = 10;

module.exports = {
    id: 'health',
    name: 'Vie',
    type: 'passive',
    description: 'Ce qui fait tenir debout',
    tags: ['health'],
    defaultData: {
        currentHealth: 10
    },


    GatherWantedInfo(info) {
    },

    GatherInfo(barrack, fighterId, arenaManager, info) {
        let fighterData = arenaManager.GetArena().fighterData[fighterId];
        if (info.hasOwnProperty('currentHealth')) {
            console.assert(fighterData.modifierData.hasOwnProperty(this.id), `Fighter ${fighterId} does not have health`);
            console.assert(fighterData.modifierData[this.id].hasOwnProperty('currentHealth'), `Fighter ${fighterId} does not have health currentHealth`);
            info.currentHealth = fighterData.modifierData[this.id].currentHealth;
        }
        if (info.hasOwnProperty('maxHealth')) {
            info.maxHealth = MAX_HEALTH;
        }
    },

    ProcessEvent(barrack, fighterId, arenaManager, event) {
        if (event.type === 'receiveDamage' &&
            event.target === fighterId &&
            event.timing === 'during'
        ) {
            console.assert(event.hasOwnProperty('amount'));
            let doTakeDamage = event.amount > 0;
            if (doTakeDamage && event.hasOwnProperty('isMissed'))
                doTakeDamage = !event.isMissed;

            if (doTakeDamage) {
                const arena = arenaManager.GetArena();
                console.assert(arena.fighterData.hasOwnProperty(fighterId), `Fighter ${fighterId} does not have mod data`);
                const fighterData = arena.fighterData[fighterId];
                console.log(fighterData);
                console.assert(fighterData.modifierData.hasOwnProperty(this.id), `Fighter ${fighterId} does not have health`);
                fighterData.modifierData[this.id].currentHealth -= event.amount;

                if (fighterData.modifierData[this.id].currentHealth <= 0) {
                    const lostEvent = {
                        modifierId: this.id,
                        type: 'outOfCombat',
                        target: fighterId,
                        author: fighterId,
                        reason: 'notEnoughHealth'
                    };
                    event.consequences.push(lostEvent);
                }

                const healthLoss = {
                    modifierId: this.id,
                    type: 'healthLoss',
                    target: fighterId,
                    author: fighterId,
                    amount: event.amount,
                };
                event.consequences.push(healthLoss);
            }
        }
        else if (event.type === 'outOfCombat' &&
            event.timing === 'during' &&
            event.target === fighterId
        ) {
            arenaManager.GetArena().fighterData[fighterId].isOutOfCombat = true;
        }
    }
}
