let mod = {};
module.exports = mod;
mod.run = {
    ranger: function (creep) {
        let range = creep.pos.getRangeTo(creep.target);
        if (!creep.flee) {
            if (range > 3) {
                creep.travelTo(creep.target, { respectRamparts: COMBAT_CREEPS_RESPECT_RAMPARTS });
            }
            if (range < 3) creep.fleeMove();
        }

        // attack ranged
        let targets = creep.pos.findInRange(creep.room.hostiles, 3);
        if (targets.length > 2) { // TODO: precalc damage dealt
            if (CHATTY) creep.say('MassAttack');
            creep.attackingRanged = creep.rangedMassAttack() == OK;
        } else if (range < 4) {
            creep.attackingRanged = creep.rangedAttack(creep.target) == OK;
        } else if (targets.length > 0) {
            creep.attackingRanged = creep.rangedAttack(targets[0]) == OK;
        }
    },
    sourceKiller: function (creep) {
        const range = creep.pos.getRangeTo(creep.target);
        if (!creep.flee && ((creep.hits === creep.hitsMax || range <= 3) || range > 4)) {
            creep.travelTo(creep.target, { respectRamparts: COMBAT_CREEPS_RESPECT_RAMPARTS });
        }
        // attack
        let attacking = creep.attack(creep.target);
        if (attacking == ERR_NOT_IN_RANGE) {
            let targets = creep.pos.findInRange(creep.room.hostiles, 1);
            if (targets.length > 0) creep.attacking = creep.attack(targets[0]) == OK;
        } else creep.attacking = attacking == OK;
    },
    melee: function (creep) {
        if (!creep.flee && creep.pos.getRangeTo(creep.target) > 1) {
            creep.travelTo(creep.target, { respectRamparts: COMBAT_CREEPS_RESPECT_RAMPARTS });
        }
        // attack
        let attacking = creep.attack(creep.target);
        if (attacking == ERR_NOT_IN_RANGE) {
            let targets = creep.pos.findInRange(creep.room.hostiles, 1);
            if (targets.length > 0)
                creep.attacking = creep.attack(targets[0]) == OK;
        } else creep.attacking = attacking == OK;
    },
    warrior: function (creep) {
        let range = creep.pos.getRangeTo(creep.target);
        let hasAttack = creep.hasActiveBodyparts(ATTACK);
        let hasRangedAttack = creep.hasActiveBodyparts(RANGED_ATTACK);
        if (!creep.flee) {
            if (hasAttack) {
                if (range > 1) {
                    creep.travelTo(creep.target, { respectRamparts: COMBAT_CREEPS_RESPECT_RAMPARTS });
                }
            } else if (hasRangedAttack) {
                if (range > 3) {
                    creep.travelTo(creep.target, { respectRamparts: COMBAT_CREEPS_RESPECT_RAMPARTS });
                }
                if (range < 3) creep.fleeMove();
            } else creep.flee = true;
        }
        // attack
        if (hasAttack) {
            let attacking = creep.attack(creep.target);
            if (attacking == ERR_NOT_IN_RANGE) {
                let targets = creep.pos.findInRange(creep.room.hostiles, 1);
                if (targets.length > 0) creep.attacking = creep.attack(targets[0]) == OK;
            } else creep.attacking = attacking == OK;
        }
        // attack ranged
        if (hasRangedAttack) {
            let targets = creep.pos.findInRange(creep.room.hostiles, 3);
            if (targets.length > 2) { // TODO: precalc damage dealt
                if (CHATTY) creep.say('MassAttack');
                creep.attackingRanged = creep.rangedMassAttack() == OK;
            } else if (range < 4) {
                creep.attackingRanged = creep.rangedAttack(creep.target) == OK;
            } else if (targets.length > 0) {
                creep.attackingRanged = creep.rangedAttack(targets[0]) == OK;
            }
        }
    },
};
mod.defaultStrategy = {
    targetFilter: function (creep) {
        return function (hostile) {
            if (hostile.owner.username === 'Source Keeper') {
                return creep.pos.getRangeTo(hostile) <= 5;
            }
            return true;
        }
    }
};
