const DAMAGE = 3;
const REACH = 1;
const CHANCE_TO_CONNECT = 0.85;

module.exports = {
    id: 'spinAttack',
    type: 'action',
    tags: ['physical'],

    GatherWantedInfo(info) {
        if (!info.hasOwnProperty('visibleEnemies'))
            info.visibleEnemies = [];
    },

    GatherInfo(barrack, fighterId, arenaManager, info) {
        if (info.hasOwnProperty('damage')) {
            info.damage = DAMAGE;
        }
        if (info.hasOwnProperty('reachMin')) {
            info.reachMin = REACH;
        }
        if (info.hasOwnProperty('reachMax')) {
            info.reachMax = REACH;
        }
    },

    ProcessEvent(barrack, fighterId, arenaManager, event) {
        if (event.id === 'sendDamage' &&
            event.executor === fighterId &&
            event.modifierId === this.id &&
            event.timing === 'during' &&
            !event.isMissed
        ) {
            const fighter = barrack.GetFighterHolder().allFighters[fighterId];
            if (!fighter.outOfCombat) {
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
                        isMissed: event.isMissed
                    };
                    event.consequences.push(receiveDamage);
                });
            }
        }
    },

    GetCommand(barrack, fighterId, arenaManager, info) {
        const fighterPosition = arenaManager.GetObjectPosition(fighterId);
        const visibleEnemies = info.visibleEnemies ?? [];
        const targets = visibleEnemies.filter(enemy =>
            Math.max(
                Math.abs(enemy.position.x - fighterPosition.x),
                Math.abs(enemy.position.y - fighterPosition.y),
            ) <= REACH
        );
        if (targets.length > 0) {
            const resultingEvent = {
                id: 'sendDamage',
                modifierId: this.id,
                executor: fighterId,
                author: fighterId,
                targets: targets.map(target => target.id),
                amount: DAMAGE,
                reachMin: REACH,
                reachMax: REACH,
                isMissed: false
            };
            const command = { type: 'actionCommand', modifierId: this.id, weight: 100, resultingEvent: resultingEvent };
            return command;
        }
        else {
            const target = this.GetClosestVisibleEnemy(fighterPosition, visibleEnemies);
            const instruction = {
                id: 'moveTowardsClosest',
                type: 'instruction',
                modifierId: this.id,
                weight: 100,
                visibleEnemies: info.visibleEnemies ?? [],
                reachMin: REACH,
                reachMax: REACH
            };
            return instruction;
        }
    },

    GetClosestVisibleEnemy(fighterPosition, visibleEnemies) {
        return visibleEnemies
            .toSorted((first, second) => {
                const firstDistance = Math.abs(first.position.x - fighterPosition.x) + Math.abs(first.position.y - fighterPosition.y);
                const secondDistance = Math.abs(second.position.x - fighterPosition.x) + Math.abs(second.position.y - fighterPosition.y);
                return firstDistance - secondDistance;
            })[0];
    }
}
