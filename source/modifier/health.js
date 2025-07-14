module.exports = {
    id: 'health',
    name: 'Vie',
    description: 'Ce qui fait tenir debout',
    default_data: {
        currentHealth: 1,
        maxHealth: 1
    },

    GatherInfo(fighter, info) {
        if (info.hasOwnProperty(currentHealth)) {
            console.assert(fighter.modifierData.hasOwnProperty(health), `Fighter ${fighter.id} does not have health`);
            console.assert(fighter.modifierData.health.hasOwnProperty(currentHealth), `Fighter ${fighter.id} does not have health health`);
            info.currentHealth = fighter.modifierData.health.currentHealth;
        }
        if (info.hasOwnProperty(maxHealth)) {
            console.assert(fighter.modifierData.hasOwnProperty(health), `Fighter ${fighter.id} does not have health`);
            console.assert(fighter.modifierData.health.hasOwnProperty(maxHealth), `Fighter ${fighter.id} does not have health health`);
            info.maxHealth = fighter.modifierData.health.maxHealth;
        }
    },

    XXXX(fighter, data) {

    }
}