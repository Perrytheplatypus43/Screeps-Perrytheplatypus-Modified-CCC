const mod = new Creep.Behaviour('hopper');
module.exports = mod;
const super_invalidAction = mod.invalidAction;
mod.invalidAction = function(creep) {
    if (super_invalidAction.call(this, creep)) return true;
    const flag = mod.getFlag(creep);
    if (creep.hits === creep.hitsMax) {
        // target, or nearest
        const hopTarget = Game.flags[creep.data.destiny.targetName] || FlagDir.find(FLAG_COLOR.hopper, creep.pos, false);
        // if we're fully healed, but not moving towards the hopper flag, or we've arrived in the target room
        const ret = hopTarget && creep.action.name === 'travelling' &&
            (!creep.target ||
                (!creep.target.name || creep.target.pos.roomName !== hopTarget.pos.roomName)
            );
        return ret;
    } else if (creep.action.name === 'travelling' && flag && creep.data.travelRoom !== flag.pos.roomName) {
        return true;
    }
    return false;
};
const super_run = mod.run;
mod.run = function(creep) {
    if (!Creep.action.avoiding.run(creep)) {
        super_run.call(this, creep);
    }
    Creep.behaviour.ranger.heal(creep);
};
mod.goTo = function(creep, flag) {
    if (creep.pos.getRangeTo(flag) > 0) {
        creep.data.travelRange = 0;
        return this.assignAction(creep, 'travelling', flag);
    } else {
        return this.assignAction(creep, 'idle');
    }
};
mod.getFlag = function(creep) {
    return Game.flags[creep.data.destiny.targetName] || FlagDir.find(FLAG_COLOR.hopper, creep.pos, false);
};
mod.nextAction = function(creep, oldTargetId){
    const hopTarget = mod.getFlag(creep);
    // no hopper flag found
    if( !hopTarget ) {
        // recycle self if no target (TODO closest spawn)
        return this.assignAction(creep, 'recycling', Game.spawns[creep.data.motherSpawn]);
    }

    const homeTarget = FlagDir.find(FLAG_COLOR.hopperHome, hopTarget.pos, false);
    if (homeTarget && creep.pos.roomName !== homeTarget.pos.roomName && creep.pos.roomName !== hopTarget.pos.roomName) {
        // go through the heal flag on initial approach
        return mod.goTo(creep, homeTarget);
    } 
    if (creep.hits === creep.hitsMax) { // hop
        Population.registerCreepFlag(creep, hopTarget);
        return mod.goTo(creep, hopTarget);
    } else { // heal
        if (homeTarget) {
            return mod.goTo(creep, homeTarget);
        } else {
            // change this so the hopper exits using the nearest exit on the way to the homeRoom and then stops just inside that room to heal
            return Creep.action.travelling.assignRoom(creep, creep.data.homeRoom);
        }
    }
};
