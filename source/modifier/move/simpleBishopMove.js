const { findClosestEnemies, createMoveCommand, manhattanDistance } = require('../../modifierHelpers/movementCommands.js');

module.exports = {
    id: 'simpleBishopMove',
    type: 'move',
    tags: ['movement'],

    GatherWantedInfo(info) {
    },

    GatherInfo(barrack, fighterId, arenaManager, info) {
    },

    ProcessEvent(barrack, fighterId, arenaManager, event) {
        if (event.modifierId !== this.id ||
            event.id !== 'moveInDirection' ||
            event.executor !== fighterId ||
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
        let commands;
        if (instruction?.type === 'instruction' && instruction.id === 'moveAwayFromClosest') {
            const fighterPos = arenaManager.GetObjectPosition(fighterId);
            const enemies = instruction.visibleEnemies ?? [];
            const closest = findClosestEnemies(enemies, enemy => manhattanDistance(enemy.position, fighterPos));
            if (closest) {
                const directions = ['northwest', 'northeast', 'southwest', 'southeast'];
                commands = directions
                    .filter(direction => closest.enemies.every(enemy => {
                        const x = fighterPos.x + (direction.includes('east') ? 1 : -1);
                        const y = fighterPos.y + (direction.includes('north') ? 1 : -1);
                        return manhattanDistance(enemy.position, { x, y }) > closest.distance;
                    }))
                    .map(direction => createMoveCommand(this.id, fighterId, direction, instruction.reachMin));
            }
        }
        else if (instruction?.type === 'instruction' && instruction.id === 'moveTowardsClosest') {
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
            const closest = findClosestEnemies(diagonalEnemies, candidate => candidate.distance);
            if (closest) {
                commands = closest.enemies
                    .flatMap(({ enemy, xDirection, yDirection }) => {
                        const horizontalDirections = xDirection === 0
                            ? ['west', 'east']
                            : [xDirection > 0 ? 'east' : 'west'];
                        const verticalDirections = yDirection === 0
                            ? ['south', 'north']
                            : [yDirection > 0 ? 'north' : 'south'];

                        return horizontalDirections.flatMap(horizontalDirection =>
                            verticalDirections.map(verticalDirection =>
                                createMoveCommand(
                                    this.id,
                                    fighterId,
                                    verticalDirection + horizontalDirection,
                                    instruction.reach,
                                    enemy.id,
                                )
                            )
                        );
                    });
            }
        }
        else {
            console.log(`[${this.id}] [GetCommand] Instruction not handled`);
        }

        return commands;
    },

};