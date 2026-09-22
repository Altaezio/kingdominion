module.exports = {
    beginningOfCombat: {
        fr: {
            short: 'Le combat commence',
            detailed: 'Le combat commence',
        },
        en: {
            short: 'The combat begins',
            detailed: 'The combat begins',
        },
    },
    beginningOfTurn: {
        fr: {
            short: 'Le tour commence',
            detailed: 'Le tour commence',
        },
        en: {
            short: 'The turn begins',
            detailed: 'The turn begins',
        },
    },
    movement: {
        fr: {
            short: '{fighter} se déplace de {amount} vers {direction}',
            detailed: '{fighter} se déplace de {amount} vers {direction} pour atteindre {destination}',
        },
        en: {
            short: '{fighter} moves {amount} toward {direction}',
            detailed: '{fighter} moves {amount} toward {direction} to reach {destination}',
        },
    },
    attack: {
        fr: {
            short: '{attacker} attaque {target} pour infliger {amount} dégâts',
            detailed: '{attacker} attaque {target} pour infliger {amount} dégâts via {modifier}',
            missed: '{attacker} rate son attaque sur {target}',
        },
        en: {
            short: '{attacker} attacks {target} for {amount} damage',
            detailed: '{attacker} attacks {target} for {amount} damage via {modifier}',
            missed: '{attacker} misses {target}',
        },
    },
    damageReceived: {
        fr: {
            short: '{target} se prend {amount} dégâts par {attacker}',
            detailed: '{target} se prend {amount} dégâts par {attacker} ({reason})',
        },
        en: {
            short: '{target} takes {amount} damage from {attacker}',
            detailed: '{target} takes {amount} damage from {attacker} ({reason})',
        },
    },
    outOfCombat: {
        fr: {
            short: '{fighter} est décédé',
            detailed: '{fighter} est décédé à cause d\'un manque de PV',
        },
        en: {
            short: '{fighter} is dead',
            detailed: '{fighter} is dead from lack of health',
        },
    },
    healthLoss: {
        fr: {
            short: '{fighter} perd {amount} PV',
            detailed: '{fighter} a perdu {amount} PV ({modifier}) et n\'en a plus que {currentHealth}',
        },
        en: {
            short: '{fighter} loses {amount} HP',
            detailed: '{fighter} loses {amount} HP ({modifier}) and now has {currentHealth}',
        },
    },
    unknown: {
        fr: {
            short: 'Événement inconnu',
            detailed: 'Événement inconnu : {eventType}',
        },
        en: {
            short: 'Unknown event',
            detailed: 'Unknown event: {eventType}',
        },
    },
};