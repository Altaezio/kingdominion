const COOLDOWN_TURNS = 3;
const DASH_DISTANCE = 2;
const { findClosestEnemies, manhattanDistance } = require('../../modifierHelpers/movementCommands.js');

const DIRECTIONS = [
    { name: 'east', x: 1, y: 0 },
    { name: 'northeast', x: 1, y: 1 },
    { name: 'north', x: 0, y: 1 },
    { name: 'northwest', x: -1, y: 1 },
    { name: 'west', x: -1, y: 0 },
    { name: 'southwest', x: -1, y: -1 },
    { name: 'south', x: 0, y: -1 },
    { name: 'southeast', x: 1, y: -1 },
];

module.exports = {
    id: 'dash',
    type: 'move',
    tags: ['movement'],
    defaultData: {
        cooldownTurnsRemaining: 0,
    },

    GatherWantedInfo(info) {
    },

    GatherInfo(barrack, fighterId, arenaManager, info) {
    },

    ProcessEvent(barrack, fighterId, arenaManager, event) {
        const modifierData = arenaManager.GetArena().fighterData[fighterId].modifierData[this.id];
        if (event.id === 'beginningOfYourTurn' &&
            event.executor === fighterId &&
            event.timing === 'during'
        ) {
            modifierData.cooldownTurnsRemaining = Math.max(0, modifierData.cooldownTurnsRemaining - 1);
        }
        else if (event.id === 'moveInDirection' &&
            event.modifierId === this.id &&
            event.executor === fighterId &&
            event.timing === 'during'
        ) {
            const fighter = barrack.GetFighterHolder().allFighters[fighterId];
            if (!fighter.outOfCombat) {
                const direction = DIRECTIONS.find(candidate => candidate.name === event.direction);
                if (!direction)
                    throw new Error(`Unsupported dash direction: ${event.direction}`);

                const position = arenaManager.GetObjectPosition(fighterId);
                arenaManager.MoveObjectXY(
                    fighterId,
                    position.x + direction.x * event.amount,
                    position.y + direction.y * event.amount,
                );
                modifierData.cooldownTurnsRemaining = COOLDOWN_TURNS;
            }
        }
    },

    GetCommand(barrack, fighterId, arenaManager, info, instruction) {
        const modifierData = arenaManager.GetArena().fighterData[fighterId].modifierData[this.id];
        let commands;
        if (modifierData.cooldownTurnsRemaining === 0 &&
            instruction?.type === 'instruction' &&
            ['moveTowardsClosest', 'moveAwayFromClosest'].includes(instruction.id)
        ) {
            const fighterPosition = arenaManager.GetObjectPosition(fighterId);
            const enemies = instruction.visibleEnemies ?? [];
            const closest = findClosestEnemies(enemies, enemy =>
                manhattanDistance(enemy.position, fighterPosition)
            );
            if (closest) {
                const isMovingAway = instruction.id === 'moveAwayFromClosest';
                commands = DIRECTIONS
                    .filter(direction => {
                        const destination = {
                            x: fighterPosition.x + direction.x * DASH_DISTANCE,
                            y: fighterPosition.y + direction.y * DASH_DISTANCE,
                        };
                        return isMovingAway
                            ? closest.enemies.every(enemy => manhattanDistance(enemy.position, destination) > closest.distance)
                            : closest.enemies.some(enemy => manhattanDistance(enemy.position, destination) < closest.distance);
                    })
                    .map(({ name }) => ({
                        type: 'moveCommand',
                        modifierId: this.id,
                        weight: -1,
                        resultingEvent: {
                            id: 'moveInDirection',
                            modifierId: this.id,
                            executor: fighterId,
                            targets: [fighterId],
                            author: fighterId,
                            amount: DASH_DISTANCE,
                            direction: name,
                        },
                    }));
            }
        }
        else if (modifierData.cooldownTurnsRemaining > 0) {
            commands = undefined;
        }
        else {
            console.log(`[${this.id}] [GetCommand] Instruction not handled`);
        }

        return commands;
    },
};
