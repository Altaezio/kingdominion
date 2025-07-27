
module.exports = {
    id: 'simpleCrossMove',
    name: 'Movement simple',
    type: 'move',
    description: 'Déplacement en croix d\'une case',


    GatherWantedInfo(info) {

    },

    GatherInfo(barrack, fighterId, map, info) {
        const thisFighterPos = map.GetObjectPosition(fighterId);
        if (info.hasOwnProperty('closestEnemies')) {
            let allFighters = barrack.GetFighters();
            let closestEnemies = [];
            info.allFighters.forEach((fighter) => {
                if (fighter.id != fighterId) {
                    const fighterPos = map.GetObjectPosition(fighter.id);
                    // TODO:: find a better way to do vectors with the map
                }
            });
        }
    },

    ProcessEvent(barrack, fighterId, map, event) {

    },

    GetAction(barrack, fighterId, map, info, instructions) {
    }
}