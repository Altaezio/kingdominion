
module.exports = {
    id: 'simpleCrossMove',
    name: 'Movement simple',
    type: 'move',
    description: 'Déplacement à 4 directions d\'une case',


    GatherWantedInfo(info) {
    },

    GatherInfo(barrack, fighterId, arena, info) {
        if (info.hasOwnProperty('closestEnemies')) {
            info.closestEnemies = this.GetClosestEnemies(barrack, fighterId, arena);
        }
    },

    ProcessEvent(barrack, fighterId, map, event) {
        if (event.modifierId === this.id && event.type === 'moveInDirection' && event.timing === 'during') {
            const [x, y] = map.GetObjectPosition(fighterId);
            let newX = x;
            let newY = y;
            if (event.direction === 'east')
                newX += event.amount;
            else if (event.direction === 'north')
                newY += event.amount;
            else if (event.direction === 'west')
                newX -= event.amount;
            else if (event.direction === 'south')
                newY -= event.amount;
            map.MoveObjectXY(fighterId, newX, newY);
        }
    },

    GetCommand(barrack, fighterId, map, info, instruction) {
        console.assert(instruction.hasOwnProperty('instructionType'), `[${this.id}] [GetCommand] Instruction does not have a type`);
        if (instruction.instructionType === 'moveTowardsClosest') {
            if (info.hasOwnProperty('closestEnemies') &&
                info.closestEnemies.length > 0) {
                console.assert(instruction.hasOwnProperty('reach'), `[${this.id}] [GetCommand] Instruction does not have a reach`);

                const [x, y] = map.GetObjectPosition(fighterId);
                const [targetX, targetY] = map.GetObjectPosition(info.closestEnemies[0].id);
                const angle = Math.atan2(targetY - y, targetX - x);
                let direction = 'east';
                if (angle >= Math.PI / 4 && angle < 3 * Math.PI / 4)
                    direction = 'north';
                else if (angle >= 3 * Math.PI / 4 && angle < -3 * Math.PI / 4)
                    direction = 'west';
                else if (angle < -Math.PI / 4)
                    direction = 'south';

                const resultingEvent = {
                    modifierId: this.id,
                    type: 'moveInDirection',
                    target: instruction.target,
                    author: fighterId,
                    amount: 1,
                    dist: instruction.reach,
                    direction: direction
                };
                const command = { modifierId: this.id, type: "moveCommand", weight: -1, resultingEvent: resultingEvent };
                return command;
            }
            else{
                console.log(`[${this.id}] [GetCommand] No closest enemy for ${instruction.instruction}`);
                return undefined;
            }
        }
        else {
            console.log(`[${this.id}] [GetCommand] Instruction not handled`);
            return undefined;
        }
    },

    GetClosestEnemies(barrack, fighterId, arena) {
        const thisFighter = barrack.GetFighterById(fighterId);
        const [x, y] = arena.GetObjectPosition(fighterId);
        let closestEnemies = [];
        const allPositions = Object.keys(arena.GetMap().map);
        allPositions.forEach((key) => {
            const [otherX, otherY] = key.split(';');
            arena.GetMap().map[key].forEach((objectId) => {
                // assume everything is a fighter for now
                if (objectId == thisFighter.id)
                    return;

                const otherFighter = barrack.GetFighterById(objectId);

                if (otherFighter.currentTeamId == thisFighter.currentTeamId)
                    return;

                const dist = Math.abs(otherX - x) + Math.abs(otherY - y);
                closestEnemies = closestEnemies.concat({ dist: dist, id: objectId });
            });
        });
        closestEnemies.sort((a, b) => {
            if (a.dist < b.dist)
                return -1;
            else if (a.dist > b.dist)
                return 1;
            return 0;
        });
        return closestEnemies;
    }
}