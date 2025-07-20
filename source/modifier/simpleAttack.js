const DAMAGE = 5;

module.exports = {
    id: 'simpleAttack',
    name: 'Attaque simple',
    type: 'action',
    description: 'Attaque de base au corps à corps',

    GatherInfo(fighter, info) {
        if (info.hasOwnProperty('damage')) {
            info.damage = DAMAGE;
        }
        if (info.hasOwnProperty('reach')) {
            info.reach = 1;
        }
    },

    ProcessEvent(fighter, event) {

    },

    GetAction(fighter, map){
        
    }
}
