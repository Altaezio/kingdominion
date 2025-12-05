
module.exports = {
    GetEventText(event) {
        const barrack = require('../source/barracks.js');
        const arena = require('../source/arena.js');
        const modifierManager = require('../source/modifierManager.js');

        const fighterHolder = barrack.GetFighterHolder();

        try {
            if (event.type === 'moveInDirection') {
                return `${barrack.GetFighterFullName(event.target)} se déplace de ${event.amount} vers ${event.direction} pour atteindre ${barrack.GetFighterFullName(event.finalTarget)}`;
            }
            if (event.type === 'sendDamage') {
                if (!event.isMissed)
                    return `${barrack.GetFighterFullName(event.target)} attaque ${barrack.GetFighterFullName(event.finalTarget)} pour infliger ${event.amount} dégâts`;
                else
                    return `${barrack.GetFighterFullName(event.target)} rate son attaque sur ${barrack.GetFighterFullName(event.finalTarget)}`;
            }
            if (event.type === 'receiveDamage') {
                if (event.amount > 0 && !event.isMissed)
                    return `${barrack.GetFighterFullName(event.target)} se prend ${event.amount} dégâts par ${barrack.GetFighterFullName(event.author)}`;
            }
            if (event.type === 'outOfCombat' && event.reason === 'notEnoughHealth') {
                const targetFighter = fighterHolder.allFighters[event.target];
                return `${barrack.GetFighterFullName(event.target)} est décédé`;
            }
        }
        catch (error) {
            const currentTime = new Date();
            console.error('[' + currentTime.toLocaleString('fr-FR') + ']: Error on event GetEventText:', error, '\nevent was:', event);
        }
    }
}
