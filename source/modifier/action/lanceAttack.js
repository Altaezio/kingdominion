const createSingleTargetAttack = require('../../modifierHelpers/createSingleTargetAttack.js');

module.exports = createSingleTargetAttack({
    id: 'lanceAttack',
    damage: 4,
    reachMin: 2,
    reachMax: 2,
    chanceToConnect: 0.75,
});
