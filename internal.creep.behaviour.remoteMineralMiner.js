const mod = new Creep.Behaviour('remoteMineralMiner');
module.exports = mod;
mod.actions = function(creep) {
    return Creep.behaviour.miner.actions.call(this, creep);
};
mod.run = function(creep) {
    return Creep.behaviour.remoteMiner.run.call(this, creep);
};
mod.getEnergy = function(creep) {
    return Creep.behaviour.miner.getEnergy.call(this, creep);
};
mod.maintain = function(creep) {
    return Creep.behaviour.miner.maintain.call(this, creep);
};
mod.strategies.mining = Creep.behaviour.mineralMiner.strategies.mining;
