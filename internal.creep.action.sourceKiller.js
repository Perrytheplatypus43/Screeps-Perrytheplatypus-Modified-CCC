var action = new Creep.Action('sourceKiller');
module.exports = action;
action.isValidAction = function(creep) {
    return creep.room.hostiles.length === 0;
};
action.isValidTarget = function(target, creep) {
    return target && (target.room !== creep.room || target.ticksToSpawn);
};
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; };
action.newTarget = function(creep){
    let flag = creep.flag;

    if (!flag) {
        flag = creep.data.destiny && Game.flags[creep.data.destiny.targetName];
    }

    if (!flag) {
        // TODO rangeModPerCrowd only works for traveling creeps's
        flag = FlagDir.find(FLAG_COLOR.sourceKiller, creep.pos, false, FlagDir.rangeMod, {
            rangeModPerCrowd: 400
        });

        if (flag) {
            if( DEBUG && TRACE ) trace('Action', {creepName:creep.name, flag:flag.name, newTarget:'assigned flag', [action.name]:'newTarget', Action:action.name});
            Population.registerCreepFlag(creep, flag);
        }
    }

    if (creep.pos.roomName === _.get(flag, ['pos', 'roomName'], creep.pos.roomName)) {
        const lowLair = _(creep.room.structures.all).filter({structureType: STRUCTURE_KEEPER_LAIR}).sortBy('ticksToSpawn').first();
        if( DEBUG && TRACE ) trace('Action', {creepName:creep.name, lair:lowLair && lowLair.pos, newTarget:'searched for low lair', [action.name]:'newTarget', Action:action.name});
        return lowLair;
    }

    return flag || null;
};
action.work = function(creep){
    if( creep.data.flagName )
        return OK;
    else return ERR_INVALID_ARGS;
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9929), SAY_PUBLIC);
};
