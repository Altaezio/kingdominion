const DAMAGE = 5;
const REACH = 1;
const CHANCE_TO_CONNECT = 0.75;

module.exports = {
    id: 'simpleAttack',
    name: 'Attaque simple',
    type: 'action',
    description: 'Attaque de base au corps à corps',
    tags: ['physical'],

    GatherWantedInfo(info) {
        if (!info.hasOwnProperty('visibleEnemies'))
            info.visibleEnemies = [];
    },

    GatherInfo(barrack, fighterId, arenaManager, info) {
        if (info.hasOwnProperty('damage')) {
            info.damage = DAMAGE;
        }
        if (info.hasOwnProperty('reach')) {
            info.reach = REACH;
        }
    },

    ProcessEvent(barrack, fighterId, arenaManager, event) {
        if (event.type === 'sendDamage' &&
            event.author === fighterId &&
            event.target === fighterId &&
            event.timing === 'during' &&
            !event.isMissed
        ) {
            const fighter = barrack.GetFighterHolder().allFighters[fighterId];
            if (!fighter.outOfCombat) {
                const receiveDamage = {
                    modifierId: this.id,
                    type: 'receiveDamage',
                    target: event.finalTarget,
                    author: event.author,
                    amount: event.amount,
                    dist: event.dist,
                    isMissed: event.isMissed
                };
                event.consequences.push(receiveDamage);
            }
        }
    },

    GetCommand(barrack, fighterId, arenaManager, info) {
        const fighterPosition = arenaManager.GetObjectPosition(fighterId);
        const target = this.GetClosestVisibleEnemy(fighterPosition, info.visibleEnemies ?? []);
        if (target &&
            Math.abs(target.position.x - fighterPosition.x) + Math.abs(target.position.y - fighterPosition.y) <= REACH
        ) {
            const attackIsMissed = Math.random() <= CHANCE_TO_CONNECT;
            const resultingEvent = {
                modifierId: this.id,
                type: 'sendDamage',
                target: fighterId,
                author: fighterId,
                amount: DAMAGE,
                dist: REACH,
                isMissed: attackIsMissed,
                finalTarget: target.id
            };
            const command = { modifierId: this.id, type: 'actionCommand', weight: 100, resultingEvent: resultingEvent };
            return command;
        }
        else {
            const instruction = {
                modifierId: this.id,
                type: 'instruction',
                weight: 100,
                instructionType: 'moveTowardsClosest',
                visibleEnemies: info.visibleEnemies ?? [],
                reach: REACH,
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
