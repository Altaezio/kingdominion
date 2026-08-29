
module.exports = {
    GetEventText(event) {
        const barrack = require('../source/barracks.js');
        const arena = require('./arenaManager.js');
        const modifierManager = require('../source/modifierManager.js');

        const fighterHolder = barrack.GetFighterHolder();

        try {
            if (event.type === 'moveInDirection') {
                return `${barrack.GetFighterFullNameById(event.target)} se déplace de ${event.amount} vers ${event.direction} pour atteindre ${barrack.GetFighterFullNameById(event.finalTarget)}`;
            }
            if (event.type === 'sendDamage') {
                if (!event.isMissed)
                    return `${barrack.GetFighterFullNameById(event.target)} attaque ${barrack.GetFighterFullNameById(event.finalTarget)} pour infliger ${event.amount} dégâts`;
                else
                    return `${barrack.GetFighterFullNameById(event.target)} rate son attaque sur ${barrack.GetFighterFullNameById(event.finalTarget)}`;
            }
            if (event.type === 'receiveDamage') {
                if (event.amount > 0 && !event.isMissed)
                    return `${barrack.GetFighterFullNameById(event.target)} se prend ${event.amount} dégâts par ${barrack.GetFighterFullNameById(event.author)}`;
            }
            if (event.type === 'outOfCombat' && event.reason === 'notEnoughHealth') {
                return `${barrack.GetFighterFullNameById(event.target)} est décédé`;
            }
            if (event.type === 'healthLoss') {
                const targetFighterId = event.target;
                let currentHealth = arena.GetArena().fighterData[targetFighterId].modifierData[event.modifierId].currentHealth;
                return `${barrack.GetFighterFullNameById(event.target)} a perdu ${event.amount} PV et n'en a plus que ${currentHealth}`;
            }
        }
        catch (error) {
            const currentTime = new Date();
            console.error('[' + currentTime.toLocaleString('fr-FR') + ']: Error on event GetEventText:', error, '\nevent was:', event);
        }
    }
}
