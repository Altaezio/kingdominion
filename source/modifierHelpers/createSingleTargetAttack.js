const { manhattanDistance } = require('./distance.js');

module.exports = function createSingleTargetAttack({
    id,
    damage,
    reachMin,
    reachMax,
    chanceToConnect,
}) {
    return {
        id,
        type: 'action',
        tags: ['physical'],

        GatherWantedInfo(info) {
            if (!Object.hasOwn(info, 'visibleEnemies'))
                info.visibleEnemies = [];
        },

        GatherInfo(barrack, fighterId, arenaManager, info) {
            if (Object.hasOwn(info, 'damage'))
                info.damage = damage;
            if (Object.hasOwn(info, 'reachMin'))
                info.reachMin = reachMin;
            if (Object.hasOwn(info, 'reachMax'))
                info.reachMax = reachMax;
        },

        ProcessEvent(barrack, fighterId, arenaManager, event) {
            if (event.id !== 'sendDamage' ||
                event.executor !== fighterId ||
                event.modifierId !== this.id ||
                event.timing !== 'during' ||
                event.isMissed
            )
                return;

            const fighter = barrack.GetFighterHolder().allFighters[fighterId];
            if (fighter.outOfCombat)
                return;

            console.assert(event.targets.length === 1, `${this.id} should only have one target`);
            event.targets.forEach(target => {
                const receiveDamage = {
                    id: 'receiveDamage',
                    modifierId: this.id,
                    executor: target,
                    targets: [target],
                    author: event.author,
                    amount: event.amount,
                    reachMin: event.reachMin,
                    reachMax: event.reachMax,
                    isMissed: event.isMissed,
                };
                event.consequences.push(receiveDamage);
            });
        },

        GetCommand(barrack, fighterId, arenaManager, info) {
            const fighterPosition = arenaManager.GetObjectPosition(fighterId);
            const visibleEnemies = info.visibleEnemies ?? [];
            const target = this.GetClosestVisibleEnemy(fighterPosition, visibleEnemies);
            if (!target)
                return undefined;

            const distance = manhattanDistance(target.position, fighterPosition);
            if (distance < reachMin) {
                return {
                    id: 'moveAwayFromClosest',
                    type: 'instruction',
                    modifierId: this.id,
                    weight: 100,
                    visibleEnemies,
                    reachMin,
                    reachMax,
                };
            }
            if (distance > reachMax) {
                return {
                    id: 'moveTowardsClosest',
                    type: 'instruction',
                    modifierId: this.id,
                    weight: 100,
                    visibleEnemies,
                    reachMin,
                    reachMax,
                };
            }

            const attackIsMissed = arenaManager.Random() > chanceToConnect;
            const resultingEvent = {
                id: 'sendDamage',
                modifierId: this.id,
                executor: fighterId,
                author: fighterId,
                targets: [target.id],
                amount: damage,
                reachMin,
                reachMax,
                isMissed: attackIsMissed,
            };
            return { type: 'actionCommand', modifierId: this.id, weight: 100, resultingEvent };
        },

        GetClosestVisibleEnemy(fighterPosition, visibleEnemies) {
            return visibleEnemies
                .toSorted((first, second) => {
                    const firstDistance = manhattanDistance(first.position, fighterPosition);
                    const secondDistance = manhattanDistance(second.position, fighterPosition);
                    return firstDistance - secondDistance;
                })[0];
        },
    };
};
