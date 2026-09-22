module.exports = {
    id: 'vision',
    name: 'Vision',
    type: 'passive',
    description: 'Permet de voir tous les combattants ennemis sur la carte',
    tags: ['vision'],

    GatherWantedInfo(info) {
    },

    GatherInfo(barrack, fighterId, arenaManager, info) {
        if (!info.hasOwnProperty('visibleEnemies'))
            return;

        const arena = arenaManager.GetArena();
        const fighter = barrack.GetFighterById(fighterId);
        Object.entries(arena.map).forEach(([positionKey, objectIds]) => {
            const [x, y] = positionKey.split(';').map(Number);
            objectIds.forEach(objectId => {
                const enemy = barrack.GetFighterById(objectId);
                if (enemy.currentTeamId === fighter.currentTeamId ||
                    arena.fighterData[enemy.id]?.isOutOfCombat
                )
                    return;

                info.visibleEnemies.push({
                    id: enemy.id,
                    position: { x, y },
                });
            });
        });
    },

    ProcessEvent(barrack, fighterId, arenaManager, event) {
    },
};