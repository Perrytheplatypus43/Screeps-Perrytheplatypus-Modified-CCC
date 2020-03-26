const mod = new Creep.Behaviour('powerMiner');
module.exports = mod;
mod.actions = function(creep) {
    return [
        Creep.action.diplomacy,
        Creep.action.harvestPower,
        Creep.action.recycling,
    ];
};
const super_nextAction = mod.nextAction;
mod.nextAction = function(creep) {
    if (creep.room.name !== creep.data.destiny.room) return Creep.action.travelling.assignRoom(creep, creep.data.destiny.room);
    return super_nextAction.call(this, creep);
};
