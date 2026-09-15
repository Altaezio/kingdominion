
const barrack = require('../source/barracks.js');
const arena = require('./arenaManager.js');

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

const locales = {
    fr: {
        movement: {
            short: '{fighter} se déplace de {amount} vers {direction}',
            detailed: '{fighter} se déplace de {amount} vers {direction} pour atteindre {destination}',
        },
        attack: {
            short: '{attacker} attaque {target} pour infliger {amount} dégâts',
            detailed: '{attacker} attaque {target} pour infliger {amount} dégâts via {modifier}',
            missed: '{attacker} rate son attaque sur {target}',
        },
        damageReceived: {
            short: '{target} se prend {amount} dégâts par {attacker}',
            detailed: '{target} se prend {amount} dégâts par {attacker} ({reason})',
        },
        outOfCombat: {
            short: '{fighter} est décédé',
            detailed: '{fighter} est décédé à cause d\'un manque de PV',
        },
        healthLoss: {
            short: '{fighter} perd {amount} PV',
            detailed: '{fighter} a perdu {amount} PV ({modifier}) et n\'en a plus que {currentHealth}',
        },
        unknown: {
            short: 'Événement inconnu',
            detailed: 'Événement inconnu : {eventType}',
        },
    },
    en: {
        movement: {
            short: '{fighter} moves {amount} toward {direction}',
            detailed: '{fighter} moves {amount} toward {direction} to reach {destination}',
        },
        attack: {
            short: '{attacker} attacks {target} for {amount} damage',
            detailed: '{attacker} attacks {target} for {amount} damage via {modifier}',
            missed: '{attacker} misses {target}',
        },
        damageReceived: {
            short: '{target} takes {amount} damage from {attacker}',
            detailed: '{target} takes {amount} damage from {attacker} ({reason})',
        },
        outOfCombat: {
            short: '{fighter} is dead',
            detailed: '{fighter} is dead from lack of health',
        },
        healthLoss: {
            short: '{fighter} loses {amount} HP',
            detailed: '{fighter} loses {amount} HP ({modifier}) and now has {currentHealth}',
        },
        unknown: {
            short: 'Unknown event',
            detailed: 'Unknown event: {eventType}',
        },
    },
};

const formatters = {
    moveInDirection: {
        description: 'Movement',
        format: ({ target, amount, direction, finalTarget }, localeName = 'fr', mode = 'short') => {
            const locale = locales[localeName] ?? locales.fr;
            const params = {
                fighter: fighterName(target),
                amount,
                direction,
                destination: fighterName(finalTarget),
            };
            return renderTemplate(
                mode === 'detailed' ? locale.movement.detailed : locale.movement.short,
                params,
            );
        },
    },
    sendDamage: {
        description: 'Attack',
        format: ({ target, finalTarget, amount, isMissed, modifierId }, localeName = 'fr', mode = 'short') => {
            const locale = locales[localeName] ?? locales.fr;
            const params = {
                attacker: fighterName(target),
                target: fighterName(finalTarget),
                amount,
                modifier: modifierId ?? 'base',
            };

            if (isMissed) {
                return renderTemplate(locale.attack.missed, params);
            }

            return renderTemplate(
                mode === 'detailed' ? locale.attack.detailed : locale.attack.short,
                params,
            );
        },
    },
    receiveDamage: {
        description: 'Damage received',
        format: ({ target, author, amount, reason }, localeName = 'fr', mode = 'short') => {
            const locale = locales[localeName] ?? locales.fr;
            const params = {
                target: fighterName(target),
                attacker: fighterName(author),
                amount,
                reason: reason ?? 'attaque',
            };

            return renderTemplate(
                mode === 'detailed' ? locale.damageReceived.detailed : locale.damageReceived.short,
                params,
            );
        },
    },
    outOfCombat: {
        description: 'Out of combat',
        format: ({ target, reason }, localeName = 'fr', mode = 'short') => {
            const locale = locales[localeName] ?? locales.fr;
            const params = {
                fighter: fighterName(target),
            };

            if (reason === 'notEnoughHealth') {
                return renderTemplate(
                    mode === 'detailed' ? locale.outOfCombat.detailed : locale.outOfCombat.short,
                    params,
                );
            }

            return renderTemplate(locale.outOfCombat.short, params);
        },
    },
    healthLoss: {
        description: 'Health lost',
        format: ({ target, amount, modifierId }, localeName = 'fr', mode = 'short') => {
            const locale = locales[localeName] ?? locales.fr;
            const targetFighterId = target;
            const params = {
                fighter: fighterName(targetFighterId),
                amount,
                modifier: modifierId ?? 'health',
                currentHealth: currentHealthOf(targetFighterId, modifierId),
            };

            return renderTemplate(
                mode === 'detailed' ? locale.healthLoss.detailed : locale.healthLoss.short,
                params,
            );
        },
    },
};

module.exports = {
    locales,
    GetEventText(event, localeName = 'fr', mode = 'short') {
        try {
            const formatter = formatters[event.type];
            if (!formatter) {
                const locale = locales[localeName] ?? locales.fr;
                const template = mode === 'detailed' ? locale.unknown.detailed : locale.unknown.short;
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
