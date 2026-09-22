
module.exports = {
    id: 'simpleCrossMove',
    name: 'Movement simple',
    type: 'move',
    description: 'Déplacement à 4 directions d\'une case',
    tags: ['movement'],


    GatherWantedInfo(info) {
    },

    GatherInfo(barrack, fighterId, arenaManager, info) {
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
        if (instruction.instructionType !== 'moveTowardsClosest') {
            console.log(`[${this.id}] [GetCommand] Instruction not handled`);
            return undefined;
        }

        const fighterPos = arenaManager.GetObjectPosition(fighterId);
        const enemies = instruction.visibleEnemies ?? [];
        const distances = enemies.map(enemy => ({
            enemy,
            distance: Math.abs(enemy.position.x - fighterPos.x) + Math.abs(enemy.position.y - fighterPos.y),
        }));
        if (distances.length === 0)
            return undefined;

        const closestDistance = Math.min(...distances.map(candidate => candidate.distance));
        return distances
            .filter(candidate => candidate.distance === closestDistance)
            .map(({ enemy }) => {
                const angle = Math.atan2(enemy.position.y - fighterPos.y, enemy.position.x - fighterPos.x);
                let direction = 'east';
                if (angle >= Math.PI / 4 && angle < 3 * Math.PI / 4)
                    direction = 'north';
                else if (angle >= 3 * Math.PI / 4 || angle < -3 * Math.PI / 4)
                    direction = 'west';
                else if (angle < -Math.PI / 4)
                    direction = 'south';

                return {
                    modifierId: this.id,
                    type: 'moveCommand',
                    weight: -1,
                    resultingEvent: {
                        modifierId: this.id,
                        type: 'moveInDirection',
                        target: fighterId,
                        author: fighterId,
                        amount: 1,
                        dist: instruction.reach,
                        direction,
                        finalTarget: enemy.id,
                    },
                };
            });
    },

}