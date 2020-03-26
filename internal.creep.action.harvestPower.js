const action = new Creep.Action('harvestPower');
module.exports = action;
action.renewTarget = false;

action.isValidAction = function(creep) {
    const powerBank = creep.room.powerBank && !creep.room.powerBank.cloak;
    if (!powerBank) {
        const flag = this.targetFlag(creep);
        if (flag) {
            flag.cloaking = Infinity;
            flag.remove();
        }
        return false;
    }
    if (creep.data.diplomacyGame && _.some(creep.room.creeps, c => c.owner.username !== creep.data.diplomacyGame && Creep.action.diplomacy.isValidTarget(c))) return false;
    return creep.hasBodyparts(ATTACK);
};

action.isValidTarget = function(target) {
    return target && target.power && target.power > 0 && !target.cloak;
};

action.newTarget = function(creep) {
    const flag = this.targetFlag(creep);
    if (!flag) return;
    return _.find(flag.pos.lookFor(LOOK_STRUCTURES), s => s instanceof StructurePowerBank);
};

action.targetFlag = function(creep) {
    return (creep.data.destiny && Game.flags[creep.data.destiny.targetName || creep.data.destiny.flagName || creep.data.flagName])
        || FlagDir.find(FLAG_COLOR.powerMining, creep.pos);
};

action.work = function(creep) {
    Population.registerCreepFlag(creep, action.targetFlag(creep));
    if (creep.hits > 100) {
        creep.attack(creep.target);
    }
};