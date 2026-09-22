module.exports = {
    id: 'simpleBishopMove',
    name: 'Mouvement diagonal simple',
    type: 'move',
    description: 'Déplacement d\'une case en diagonale',
    tags: ['movement'],

    GatherWantedInfo(info) {
    },

    GatherInfo(barrack, fighterId, arenaManager, info) {
    },

    ProcessEvent(barrack, fighterId, arenaManager, event) {
        if (event.modifierId !== this.id ||
            event.type !== 'moveInDirection' ||
            event.target !== fighterId ||
            event.timing !== 'during'
        )
            return;

        const fighter = barrack.GetFighterHolder().allFighters[fighterId];
        if (fighter.outOfCombat)
            return;

        const fighterPos = arenaManager.GetObjectPosition(fighterId);
        let newX = fighterPos.x;
        let newY = fighterPos.y;
        if (event.direction.includes('east'))
            newX += event.amount;
        else if (event.direction.includes('west'))
            newX -= event.amount;
        if (event.direction.includes('north'))
            newY += event.amount;
        else if (event.direction.includes('south'))
            newY -= event.amount;
        arenaManager.MoveObjectXY(fighterId, newX, newY);
    },

    GetCommand(barrack, fighterId, arenaManager, info, instruction) {
        console.assert(instruction.hasOwnProperty('instructionType'), `[${this.id}] [GetCommand] Instruction does not have a type`);
        if (instruction.instructionType !== 'moveTowardsClosest')
            return undefined;

        const fighterPos = arenaManager.GetObjectPosition(fighterId);
        const diagonalEnemies = (instruction.visibleEnemies ?? [])
            .map(enemy => {
                const xDistance = Math.abs(enemy.position.x - fighterPos.x);
                const yDistance = Math.abs(enemy.position.y - fighterPos.y);
                return {
                    enemy,
                    distance: Math.max(xDistance, yDistance),
                    xDirection: Math.sign(enemy.position.x - fighterPos.x),
                    yDirection: Math.sign(enemy.position.y - fighterPos.y),
                };
            })
            .filter(candidate => candidate.distance > 0);
        if (diagonalEnemies.length === 0)
            return undefined;

        const closestDistance = Math.min(...diagonalEnemies.map(candidate => candidate.distance));
        return diagonalEnemies
            .filter(candidate => candidate.distance === closestDistance)
            .flatMap(({ enemy, xDirection, yDirection }) => {
                const horizontalDirections = xDirection === 0
                    ? ['west', 'east']
                    : [xDirection > 0 ? 'east' : 'west'];
                const verticalDirections = yDirection === 0
                    ? ['south', 'north']
                    : [yDirection > 0 ? 'north' : 'south'];

                return horizontalDirections.flatMap(horizontalDirection =>
                    verticalDirections.map(verticalDirection => ({
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
                            direction: verticalDirection + horizontalDirection,
                            finalTarget: enemy.id,
                        },
                    }))
                );
            });
    },

};