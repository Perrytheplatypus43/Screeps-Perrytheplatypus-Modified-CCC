let mod = {};
module.exports = mod;
mod.run = {
    melee: function(creep){
        if( !creep.flee ){
            if( creep.target instanceof Flag ){
                creep.travelTo( creep.target );
                return;
            } else if( creep.target instanceof ConstructionSite ){
                creep.travelTo( creep.target, {range:0} );
                return;
            }
            creep.travelTo( creep.target );
        }
        if( !creep.target.my )
            creep.attacking = creep.attack(creep.target) == OK;
    },
    ranger: function(creep){
        var range = creep.pos.getRangeTo(creep.target);
        if( !creep.flee ){
            if( creep.target instanceof Flag ){
                creep.travelTo( creep.target );
                return;
            } else if( creep.target instanceof ConstructionSite ){
                creep.travelTo( creep.target, {range:0});
                return;
            }
            if( range > 3 ){
                creep.travelTo( creep.target );
            }
            if( range < 3 ){
                creep.move(creep.target.pos.getDirectionTo(creep));
            }
        }
        // attack
        var targets = creep.pos.findInRange(creep.room.hostiles, 3);
        if(targets.length > 2) { // TODO: calc damage dealt
            if(CHATTY) creep.say('MassAttack');
            creep.attackingRanged = creep.rangedMassAttack() == OK;
            return;
        }
        if( range < 4 ) {
            creep.attackingRanged = creep.rangedAttack(creep.target) == OK;
            return;
        }
        if(targets.length > 0){
            creep.attackingRanged = creep.rangedAttack(targets[0]) == OK;
        }
    },
    warrior: function(creep){
        let range = creep.pos.getRangeTo(creep.target);
        let hasAttack = creep.hasActiveBodyparts(ATTACK);
        let hasRangedAttack = creep.hasActiveBodyparts(RANGED_ATTACK);
        if( !creep.flee ) {
            if( hasAttack ){
                if( creep.target instanceof Flag ){
                    creep.travelTo( creep.target );
                    return;
                } else if( creep.target instanceof ConstructionSite ){
                    creep.travelTo( creep.target, {range:0} );
                    return;
                }
                creep.travelTo( creep.target );
            } else if( hasRangedAttack ) {
                if( creep.target instanceof Flag ){
                    creep.travelTo( creep.target );
                    return;
                } else if( creep.target instanceof ConstructionSite ){
                    creep.travelTo( creep.target, {range:0} );
                    return;
                }
                if( range > 3 ){
                    creep.travelTo( creep.target );
                }
                if( range < 3 ){
                    //creep.move(creep.target.pos.getDirectionTo(creep));
                    creep.fleeMove();
                }
            } else creep.flee = true;
        }
        // attack
        if( hasAttack ){
            let attacking = creep.attack(creep.target);
            if( attacking == ERR_NOT_IN_RANGE ) {
                let targets = creep.pos.findInRange(creep.room.hostiles, 1);
                if( targets.length > 0)
                    creep.attacking = creep.attack(targets[0]) == OK;
            } else creep.attacking = attacking == OK;
        }
        // attack ranged
        if( hasRangedAttack ) {
            let targets = creep.pos.findInRange(creep.room.hostiles, 3);
            if(targets.length > 2) { // TODO: precalc damage dealt
                if(CHATTY) creep.say('MassAttack');
                creep.attackingRanged = creep.rangedMassAttack() == OK;
                return;
            }
            let range = creep.pos.getRangeTo(creep.target);
            if( range < 4 ) {
                creep.attackingRanged = creep.rangedAttack(creep.target) == OK;
                return;
            }
            if(targets.length > 0){
                creep.attackingRanged = creep.rangedAttack(targets[0]) == OK;
            }
        }
    },
    trainLeader: function(creep){ Creep.action.invading.run['warrior'](creep); },
};
