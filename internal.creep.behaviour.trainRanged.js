const mod = new Creep.Behaviour('trainRanged');
module.exports = mod;
const super_run = mod.run;
mod.run = function(creep) {
    super_run.call(this, creep);
    let hasRangedAttack = creep.hasActiveBodyparts(RANGED_ATTACK);
    if( hasRangedAttack ) {
        const targets = creep.pos.findInRange(creep.room.hostiles, 3);
        if(targets.length > 2) { // TODO: precalc damage dealt
            if(CHATTY) creep.say('MassAttack');
            creep.attackingRanged = creep.rangedMassAttack() == OK;
            return;
        } else {
            creep.attackingRanged = creep.rangedAttack(targets[0]) == OK;
        }
    }
};
mod.nextAction = function(creep) {
    const rallyFlag = Game.flags[creep.data.destiny.targetName];
    const attackFlag = FlagDir.find(FLAG_COLOR.attackTrain, creep.pos, false);
    if (!rallyFlag) {
        return this.assignAction(creep, 'recycling');
    } else if(!creep.data.destiny.boosted || (creep.data.destiny.boosted && !Creep.action.boosting.assign(creep))) {
        Population.registerCreepFlag(creep, rallyFlag);
        // find the creep ahead of us in the train
        const leadingCreep = Task.train.findLeading(creep);
        const leadingRoom = leadingCreep && leadingCreep.pos.roomName;
        const attackRoom = attackFlag && attackFlag.pos.roomName;
        const rallyRoom = rallyFlag && rallyFlag.pos.roomName;
        if (!leadingCreep || !(leadingRoom === rallyRoom || leadingRoom === attackRoom)) {
            if (creep.pos.roomName !== rallyRoom) {
                Creep.action.travelling.assignRoom(creep, rallyRoom);
            } else if (creep.pos.getRangeTo(rallyFlag) > 1) {
                this.assignAction(creep, 'travelling', rallyFlag);
            } else {
                this.assignAction(creep, 'idle');
            }
        } else if (creep.pos.getRangeTo(leadingCreep) > 1) {
            this.assignAction(creep, 'travelling', leadingCreep);
        } else {
            this.assignAction(creep, 'idle');
        }
    }
};
