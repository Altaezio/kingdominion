
module.exports = {
    id: 'simpleCrossMove',
    name: 'Movement simple',
    type: 'move',
    description: 'Déplacement à 4 directions d\'une case',
    tags: ['movement'],


    GatherWantedInfo(info) {
    },

    GatherInfo(barrack, fighterId, arenaManager, info) {
        if (info.hasOwnProperty('closestEnemies')) {
            info.closestEnemies = this.GetClosestEnemies(barrack, fighterId, arenaManager);
        }
    },

    ProcessEvent(barrack, fighterId, arenaManager, event) {
        if (event.modifierId === this.id &&
            event.type === 'moveInDirection' &&
            event.target === fighterId &&
            event.timing === 'during'
        ) {
            const fighter = barrack.GetFighterHolder().allFighters[fighterId];
            if (!fighter.outOfCombat) {
                const fighterPos = arenaManager.GetObjectPosition(fighterId);
                let newX = fighterPos.x;
                let newY = fighterPos.y;
                if (event.direction === 'east')
                    newX += event.amount;
                else if (event.direction === 'north')
                    newY += event.amount;
                else if (event.direction === 'west')
                    newX -= event.amount;
                else if (event.direction === 'south')
                    newY -= event.amount;
                arenaManager.MoveObjectXY(fighterId, newX, newY);
            }
        }
    },

    GetCommand(barrack, fighterId, arenaManager, info, instruction) {
        console.assert(instruction.hasOwnProperty('instructionType'), `[${this.id}] [GetCommand] Instruction does not have a type`);
        if (instruction.instructionType === 'moveTowardsClosest') {
            if (info.hasOwnProperty('closestEnemies') &&
                info.closestEnemies.length > 0) {
                console.assert(instruction.hasOwnProperty('reach'), `[${this.id}] [GetCommand] Instruction does not have a reach`);

                const fighterPos = arenaManager.GetObjectPosition(fighterId);
                const targetPos = arenaManager.GetObjectPosition(info.closestEnemies[0].id);
                const angle = Math.atan2(targetPos.y - fighterPos.y, targetPos.x - fighterPos.x);
                let direction = 'east';
                if (angle >= Math.PI / 4 && angle < 3 * Math.PI / 4)
                    direction = 'north';
                else if (angle >= 3 * Math.PI / 4 || angle < -3 * Math.PI / 4)
                    direction = 'west';
                else if (angle < -Math.PI / 4)
                    direction = 'south';

                console.debug('[DEBUG] angle is', angle, 'so direction is', direction);

                const resultingEvent = {
                    modifierId: this.id,
                    type: 'moveInDirection',
                    target: fighterId,
                    author: fighterId,
                    amount: 1,
                    dist: instruction.reach,
                    direction: direction,
                    finalTarget: info.closestEnemies[0].id
                };
                const command = { modifierId: this.id, type: "moveCommand", weight: -1, resultingEvent: resultingEvent };
                return command;
            }
            else {
                console.log(`[${this.id}] [GetCommand] No closest enemy for ${instruction.instruction}`);
                return undefined;
            }
        }
        else {
            console.log(`[${this.id}] [GetCommand] Instruction not handled`);
            return undefined;
        }
    },

    GetClosestEnemies(barrack, fighterId, arenaManager) {
        const arena = arenaManager.GetArena();
        const thisFighter = barrack.GetFighterById(fighterId);
        const fighterPos = arenaManager.GetObjectPosition(fighterId);
        let closestEnemies = [];
        const allPositions = Object.keys(arena.map);
        allPositions.forEach((key) => {
            const [otherX, otherY] = key.split(';');
            console.log(arena.map[key]);
            arena.map[key].forEach((objectId) => {
                // assume everything is a fighter for now
                if (objectId == thisFighter.id)
                    return;

                const otherFighter = barrack.GetFighterById(objectId);

                if (otherFighter.currentTeamId == thisFighter.currentTeamId ||
                    arena.fighterData[otherFighter.id].isOutOfCombat)
                    return;

                const dist = Math.abs(otherX - fighterPos.x) + Math.abs(otherY - fighterPos.y);
                closestEnemies.push({ dist: dist, id: objectId });
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