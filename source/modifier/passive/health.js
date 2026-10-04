const MAX_HEALTH = 10;

module.exports = {
    id: 'health',
    type: 'passive',
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
        if (event.id === 'receiveDamage' &&
            event.targets.includes(fighterId) &&
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
                        id: 'outOfCombat',
                        modifierId: this.id,
                        executor: fighterId,
                        targets: [fighterId],
                        author: fighterId,
                        reason: 'notEnoughHealth'
                    };
                    event.consequences.push(lostEvent);
                }

                const healthLoss = {
                    id: 'healthLoss',
                    modifierId: this.id,
                    executor: fighterId,
                    targets: [fighterId],
                    author: fighterId,
                    amount: event.amount,
                };
                event.consequences.push(healthLoss);
            }
        }
        else if (event.id === 'outOfCombat' &&
            event.timing === 'during' &&
            event.targets.includes(fighterId)
        ) {
            arenaManager.GetArena().fighterData[fighterId].isOutOfCombat = true;
        }
    }
}
