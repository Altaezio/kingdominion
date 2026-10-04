const createSingleTargetAttack = require('../../modifierHelpers/createSingleTargetAttack.js');

module.exports = createSingleTargetAttack({
    id: 'bowShoot',
    damage: 2,
    reachMin: 2,
    reachMax: 10,
    chanceToConnect: 0.75,
});
