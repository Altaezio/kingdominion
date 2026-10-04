const texts = {
    health: {
        name: { fr: 'Vie', en: 'Health' },
        description: { fr: 'Ce qui fait tenir debout', en: 'What keeps a fighter standing' },
    },
    simpleAttack: {
        name: { fr: 'Attaque simple', en: 'Simple attack' },
        description: { fr: 'Attaque de base au corps à corps', en: 'Basic melee attack' },
    },
    lanceAttack: {
        name: { fr: 'Coup de lance', en: 'Lance thrust' },
        description: { fr: 'Attaque un ennemi à deux cases avec une lance', en: 'Attacks one enemy up to two tiles away with a lance' },
    },
    spinAttack: {
        name: { fr: 'Attaque tournoyante', en: 'Spin attack' },
        description: { fr: 'Attaque tous les ennemis proches', en: 'Attacks all nearby enemies' },
    },
    bowShoot: {
        name: { fr: 'Tir à l’arc', en: 'Bow shot' },
        description: { fr: 'Attaque un ennemi à distance', en: 'Attacks one enemy at range' },
    },
    dodge: {
        name: { fr: 'Esquive', en: 'Dodge' },
        description: { fr: 'Peut éviter une attaque reçue', en: 'Can avoid an incoming attack' },
    },
    simpleBishopMove: {
        name: { fr: 'Mouvement diagonal simple', en: 'Simple diagonal movement' },
        description: { fr: 'Déplacement d\'une case en diagonale', en: 'Move one tile diagonally' },
    },
    simpleCrossMove: {
        name: { fr: 'Mouvement simple', en: 'Simple movement' },
        description: { fr: 'Déplacement à 4 directions d\'une case', en: 'Move one tile in one of four directions' },
    },
    vision: {
        name: { fr: 'Vision', en: 'Vision' },
        description: { fr: 'Permet de voir tous les combattants ennemis sur la carte', en: 'Allows seeing all enemy fighters on the map' },
    },
    dash: {
        name: { fr: 'Ruée', en: 'Dash' },
        description: { fr: 'Se déplace de deux cases dans une direction (recharge de 3 tours)', en: 'Moves two tiles in one direction (3-turn cooldown)' },
    },
};

function getLanguage(locale) {
    return locale?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

function getModifierText(modifierId, textType, locale) {
    const translation = texts[modifierId]?.[textType];
    if (!translation)
        throw new Error(`Missing modifier ${textType} localization: ${modifierId}`);

    const text = translation[getLanguage(locale)];
    if (typeof text !== 'string' || text.length === 0)
        throw new Error(`Missing ${getLanguage(locale)} modifier ${textType} localization: ${modifierId}`);
    return text;
}

function GetName(modifierId, locale) {
    return getModifierText(modifierId, 'name', locale);
}

function GetDescription(modifierId, locale) {
    return getModifierText(modifierId, 'description', locale);
}

function ValidateModifierLocalization(modifierId) {
    for (const language of ['fr', 'en']) {
        GetName(modifierId, language);
        GetDescription(modifierId, language);
    }
}

module.exports = { GetName, GetDescription, ValidateModifierLocalization };
