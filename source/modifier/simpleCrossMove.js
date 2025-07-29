
module.exports = {
    id: 'simpleCrossMove',
    name: 'Movement simple',
    type: 'move',
    description: 'Déplacement en croix d\'une case',


    GatherWantedInfo(info) {
    },

    GatherInfo(barrack, fighterId, map, info) {
        const thisFighter = barrack.GetFighterById(fighterId);
        const [x, y] = map.GetObjectPosition(fighterId).split(';');
        if (info.hasOwnProperty('closestEnemies')) {
            let closestEnemies = [];
            const allPositions = Object.keys(map.loadedMap);
            allPositions.forEach((key) => {
                const [otherX, otherY] = key.split(';');
                map.loadedMap[key].forEach((objectId) => {
                    // assume everything is a fighter for now
                    if (objectId == thisFighter.id)
                        return;

                    const otherFighter = barrack.GetFighterById(objectId);

                    if (otherFighter.currentTeamId == thisFighter.currentTeamId)
                        return;

                    const dist = Math.abs(otherX - x) + Math.abs(otherY - y);
                    closestEnemies.concat({ dist: dist, id: objectId });
                });
            });
            closestEnemies.sort((a, b) => {
                if (a.dist < b.dist)
                    return -1;
                else if (a.dist > b.dist)
                    return 1;
                return 0;
            });
            info.closestEnemies = closestEnemies;
        }
    },

    ProcessEvent(barrack, fighterId, map, event) {
    },

    GetCommand(barrack, fighterId, map, info, instructions) {

    }
}