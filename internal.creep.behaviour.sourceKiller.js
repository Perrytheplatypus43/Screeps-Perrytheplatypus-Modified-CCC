const mod = new Creep.Behaviour('sourceKiller');
module.exports = mod;
const super_run = mod.run;
mod.run = function(creep) {
    if (creep.flag && !creep.data.predictedRenewal) {
        creep.data.predictedRenewal = creep.data.spawningTime + 50 + 50 * routeRange(creep.data.homeRoom, creep.flag.pos.roomName);
    }
    creep.flee = creep.flee || !creep.hasActiveBodyparts([ATTACK, RANGED_ATTACK]);
    creep.attacking = false;
    creep.attackingRanged = false;
    super_run.call(this, creep);
    Creep.behaviour.ranger.heal.call(this, creep);
};
mod.actions = function(creep) {
    return [
        Creep.action.defending,
        Creep.action.sourceKiller
    ];
};
const super_nextAction = mod.nextAction;
mod.nextAction = function(creep) {
    const flag = creep.flag || Game.flags[creep.data.destiny.targetName];
    if (!flag) return this.assignAction(creep, 'recycling');
    else if (creep.pos.roomName !== flag.pos.roomName) return Creep.action.travelling.assignRoom(creep, flag.pos.roomName);
    super_nextAction.call(this, creep);
};
mod.strategies.defaultStrategy.moveOptions = function(options) {
    options.avoidSKCreeps = false;
    return options;
};
mod.strategies.defending = {
    targetFilter: function(creep) {
        return function (hostile) {
            return true;
        };
    }
};