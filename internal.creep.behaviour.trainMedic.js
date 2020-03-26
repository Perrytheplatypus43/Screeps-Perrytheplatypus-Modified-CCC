const mod = new Creep.Behaviour('trainMedic');
module.exports = mod;
const super_run = mod.run;
mod.run = function(creep) {
    super_run.call(this, creep);
    this.heal(creep);
};
mod.nextAction = function(creep) {
    const rallyFlag = Game.flags[creep.data.destiny.targetName];
    const attackFlag = FlagDir.find(FLAG_COLOR.attackTrain, creep.pos, false);
    if (!rallyFlag) {
        return this.assignAction(creep, 'recycling');
    } else if(!creep.data.destiny.boosted || (creep.data.destiny.boosted && !Creep.action.boosting.assign(creep))){
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
mod.heal = function(creep){
    if( creep.data.body.heal !== undefined  ) {
        const mustHealSelf = creep.hits < creep.data.hullHits;
        if( mustHealSelf || creep.hits < creep.hitsMax ){
            // Heal self if not attacking or missing combat parts
            if( mustHealSelf || !creep.attacking ) {
                creep.heal(creep);
            }
        }
        // Heal other
        else if( creep.room.casualties.length > 0 ){
            let injured = creep.pos.findInRange(creep.room.casualties, 3);
            if( injured.length > 0 ){
                const target = creep.pos.findClosestByRange(injured);
                const canHeal = creep.pos.isNearTo(target) && !mustHealSelf;
                const shouldHeal = target.data && target.hits < target.hitsMax;
                // Heal other if not attacking or they are badly hurt
                if( canHeal && (shouldHeal || !creep.attacking) ) {
                    creep.heal(target);
                } else if( shouldHeal && !(creep.attackingRanged || creep.attacking || mustHealSelf)) {
                    creep.rangedHeal(target);
                }
            }
        }
    }
};
