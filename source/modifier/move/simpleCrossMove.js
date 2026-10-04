
const { findClosestEnemies, createMoveCommand, manhattanDistance } = require('../../modifierHelpers/movementCommands.js');

module.exports = {
    id: 'simpleCrossMove',
    type: 'move',
    tags: ['movement'],


    GatherWantedInfo(info) {
    },

    GatherInfo(barrack, fighterId, arenaManager, info) {
    },

    ProcessEvent(barrack, fighterId, arenaManager, event) {
        if (event.modifierId === this.id &&
            event.id === 'moveInDirection' &&
            event.executor === fighterId &&
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
        let commands;
        if (instruction?.type === 'instruction' && instruction.id === 'moveAwayFromClosest') {
            const fighterPos = arenaManager.GetObjectPosition(fighterId);
            const enemies = instruction.visibleEnemies ?? [];
            const closest = findClosestEnemies(enemies, enemy => manhattanDistance(enemy.position, fighterPos));
            if (closest) {
                const directions = [
                    { direction: 'east', x: 1, y: 0 },
                    { direction: 'north', x: 0, y: 1 },
                    { direction: 'west', x: -1, y: 0 },
                    { direction: 'south', x: 0, y: -1 },
                ];
                commands = directions
                    .filter(({ x, y }) => closest.enemies.every(enemy =>
                        manhattanDistance(enemy.position, { x: fighterPos.x + x, y: fighterPos.y + y }) > closest.distance
                    ))
                    .map(({ direction }) => createMoveCommand(this.id, fighterId, direction, instruction.reachMin));
            }
        }
        else if (instruction?.type === 'instruction' && instruction.id === 'moveTowardsClosest') {
            const fighterPos = arenaManager.GetObjectPosition(fighterId);
            const enemies = instruction.visibleEnemies ?? [];
            const closest = findClosestEnemies(enemies, enemy => manhattanDistance(enemy.position, fighterPos));
            if (closest) {
                commands = closest.enemies.map(enemy => {
                        const angle = Math.atan2(enemy.position.y - fighterPos.y, enemy.position.x - fighterPos.x);
                        let direction = 'east';
                        if (angle >= Math.PI / 4 && angle < 3 * Math.PI / 4)
                            direction = 'north';
                        else if (angle >= 3 * Math.PI / 4 || angle < -3 * Math.PI / 4)
                            direction = 'west';
                        else if (angle < -Math.PI / 4)
                            direction = 'south';

                        return createMoveCommand(this.id, fighterId, direction, instruction.reach, enemy.id);
                    });
            }
        }
        else {
            console.log(`[${this.id}] [GetCommand] Instruction not handled`);
        }

        return commands;
    },

}