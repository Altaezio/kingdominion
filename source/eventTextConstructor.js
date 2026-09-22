
const barrack = require('../source/barracks.js');
const arena = require('./arenaManager.js');
const eventTexts = require('./eventTexts.js');

function fighterName(id) {
    return barrack.GetFighterFullNameById(id);
}

function currentHealthOf(targetId, modifierId) {
    const fighterData = arena.GetArena().fighterData[targetId];
    if (!fighterData || !fighterData.modifierData || !fighterData.modifierData[modifierId]) {
        return 'inconnu';
    }
    return fighterData.modifierData[modifierId].currentHealth;
}

function renderTemplate(template, params) {
    return template.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? `{${key}}`);
}

const formatters = {
    beginningOfCombat: {
        description: 'Beginning of combat',
        format: (event, localeName = 'fr', mode = 'short') => {
            const texts = eventTexts.beginningOfCombat[localeName] ?? eventTexts.beginningOfCombat.fr;
            return renderTemplate(mode === 'detailed' ? texts.detailed : texts.short, event);
        },
    },
    beginningOfTurn: {
        description: 'Beginning of turn',
        format: (event, localeName = 'fr', mode = 'short') => {
            const texts = eventTexts.beginningOfTurn[localeName] ?? eventTexts.beginningOfTurn.fr;
            return renderTemplate(mode === 'detailed' ? texts.detailed : texts.short, event);
        },
    },
    moveInDirection: {
        description: 'Movement',
        format: ({ target, amount, direction, finalTarget }, localeName = 'fr', mode = 'short') => {
            const texts = eventTexts.movement[localeName] ?? eventTexts.movement.fr;
            const params = {
                fighter: fighterName(target),
                amount,
                direction,
                destination: fighterName(finalTarget),
            };
            return renderTemplate(
                mode === 'detailed' ? texts.detailed : texts.short,
                params,
            );
        },
    },
    sendDamage: {
        description: 'Attack',
        format: ({ target, finalTarget, amount, isMissed, modifierId }, localeName = 'fr', mode = 'short') => {
            const texts = eventTexts.attack[localeName] ?? eventTexts.attack.fr;
            const params = {
                attacker: fighterName(target),
                target: fighterName(finalTarget),
                amount,
                modifier: modifierId ?? 'base',
            };

            if (isMissed) {
                return renderTemplate(texts.missed, params);
            }

            return renderTemplate(
                mode === 'detailed' ? texts.detailed : texts.short,
                params,
            );
        },
    },
    receiveDamage: {
        description: 'Damage received',
        format: ({ target, author, amount, reason }, localeName = 'fr', mode = 'short') => {
            const texts = eventTexts.damageReceived[localeName] ?? eventTexts.damageReceived.fr;
            const params = {
                target: fighterName(target),
                attacker: fighterName(author),
                amount,
                reason: reason ?? 'attaque',
            };

            return renderTemplate(
                mode === 'detailed' ? texts.detailed : texts.short,
                params,
            );
        },
    },
    outOfCombat: {
        description: 'Out of combat',
        format: ({ target, reason }, localeName = 'fr', mode = 'short') => {
            const texts = eventTexts.outOfCombat[localeName] ?? eventTexts.outOfCombat.fr;
            const params = {
                fighter: fighterName(target),
            };

            if (reason === 'notEnoughHealth') {
                return renderTemplate(
                    mode === 'detailed' ? texts.detailed : texts.short,
                    params,
                );
            }

            return renderTemplate(texts.short, params);
        },
    },
    healthLoss: {
        description: 'Health lost',
        format: ({ target, amount, modifierId }, localeName = 'fr', mode = 'short') => {
            const texts = eventTexts.healthLoss[localeName] ?? eventTexts.healthLoss.fr;
            const targetFighterId = target;
            const params = {
                fighter: fighterName(targetFighterId),
                amount,
                modifier: modifierId ?? 'health',
                currentHealth: currentHealthOf(targetFighterId, modifierId),
            };

            return renderTemplate(
                mode === 'detailed' ? texts.detailed : texts.short,
                params,
            );
        },
    },
};

module.exports = {
    locales: eventTexts,
    GetEventText(event, localeName = 'fr', mode = 'short') {
        try {
            const formatter = formatters[event.type];
            if (!formatter) {
                const texts = eventTexts.unknown[localeName] ?? eventTexts.unknown.fr;
                const template = mode === 'detailed' ? texts.detailed : texts.short;
                return renderTemplate(template, { eventType: event?.type ?? 'unknown' });
            }
            return formatter.format(event, localeName, mode);
        }
        catch (error) {
            const currentTime = new Date();
            console.error('[' + currentTime.toLocaleString('fr-FR') + ']: Error on event GetEventText:', error, '\nevent was:', event);
            return '';
        }
    },
};
