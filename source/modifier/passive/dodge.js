const CHANCE_TO_DODGE = 0.5;

module.exports = {
    id: 'dodge',
    type: 'passive',
    tags: [],

    GatherWantedInfo(info) {
    },

    GatherInfo(barrack, fighterId, arenaManager, info) {
    },

    ProcessEvent(barrack, fighterId, arenaManager, event) {
        if (event.id === 'receiveDamage' &&
            event.targets.includes(fighterId) &&
            event.timing === 'before' &&
            !event.isMissed
        ) {
            const dodged = arenaManager.Random() <= CHANCE_TO_DODGE;
            event.isMissed = dodged;
            const dodgeAttack = {
                id: 'dodgeAttack',
                modifierId: this.id,
                executor: fighterId,
                targets: [fighterId],
                author: fighterId,
                dodged: dodged
            }
            event.consequences.push(dodgeAttack);
        }
    },
};
