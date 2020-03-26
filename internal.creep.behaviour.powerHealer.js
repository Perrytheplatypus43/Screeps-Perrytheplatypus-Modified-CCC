const mod = new Creep.Behaviour('powerHealer');
module.exports = mod;
const super_run = mod.run;
mod.run = function(creep) {
    super_run.call(this, creep);
    Creep.behaviour.ranger.heal.call(this, creep);
};
mod.nextAction = function(creep) {
    const flag = this.getFlag(creep);
    let miner = Game.getObjectById(creep.data.miner);
    if (!flag) {
        // flag is gone, do we still need to heal our miner?
        if (!miner || miner.hits === miner.hitsMax) {
            return this.assignAction(creep, 'recycling');
        } else if (!creep.pos.isNearTo(miner)) {
            creep.data.ignoreCreeps = false;
            return this.assignAction(creep, 'travelling', miner);
        } else {
            return this.assignAction(creep, 'idle');
        }
    }

    Population.registerCreepFlag(creep, flag);
    if (!miner) {
        miner = Game.creeps[Creep.prototype.findGroupMemberByType("powerMiner", flag.name)];
        if (miner && miner.targetOf && miner.targetOf.length >= 2) { // try to find another miner with less than two healers
            const otherMiners = creep.room.creeps.filter(c => c.data && c.data.creepType === 'powerMiner' && (!c.targetOf || c.targetOf.length < 2));
            if (otherMiners.length) {
                miner = otherMiners[0];
            }
        }
        creep.data.miner = miner && miner.id;
    }

    if (miner) Util.get(miner, 'targetOf', []).push(creep); // initialize if undefined, and register it as our target

    // if the miner is next to the flag (working presumably) but we are not next to the miner
    if (miner && miner.pos.isNearTo(flag) && !creep.pos.isNearTo(miner)) {
        creep.data.ignoreCreeps = false;
        return this.assignAction(creep, 'travelling', miner);
    } else if (creep.pos.getRangeTo(flag) > 2) {
        creep.data.travelRange = 2;
        return this.assignAction(creep, 'travelling', flag);        
    }
    return this.assignAction(creep, 'idle');
};
mod.getFlag = function(creep) {
    let flag = creep.data.destiny && Game.flags[creep.data.destiny.targetName];
    if (flag) return flag;
    else return FlagDir.find(FLAG_COLOR.powerMining, creep.pos, false);
};
