const DAMAGE = 5;
const REACH = 1;
const CHANCE_TO_CONNECT = 0.5;

module.exports = {
    id: 'simpleAttack',
    name: 'Attaque simple',
    type: 'action',
    description: 'Attaque de base au corps à corps',

    GatherWantedInfo(info) {
        if (!info.hasOwnProperty('closestEnemies')) {
            info.closestEnemies = [];
        }
    },

    GatherInfo(barrack, fighterId, map, info) {
        if (info.hasOwnProperty('damage')) {
            info.damage = DAMAGE;
        }
        if (info.hasOwnProperty('reach')) {
            info.reach = REACH;
        }
    },

    ProcessEvent(barrack, fighterId, map, event) {

    },

    GetAction(barrack, fighterId, map, info) {
        if (info.hasOwnProperty('closestEnemies') &&
            info.closestEnemies[0].distance <= REACH) {
            // ATAK
            let action = { modifierId: this.id, type: "command", weight: 100, target: info.closestEnemy.id, damage: DAMAGE };
            const attackIsMissed = Math.random() <= CHANCE_TO_CONNECT;
            action.isMissed = attackIsMissed;
            return action;
        }
        else {
            // INSTRUCTION TO MOVE TOWARDS CLOSEST
            let instruction = { modifierId: this.id, type: "instruction", weight: 100, instruction: "moveTowardsClosest", reach: REACH };
            return instruction;
        }
    }
}
