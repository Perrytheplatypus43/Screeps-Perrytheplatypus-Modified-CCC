const mod = {};
module.exports = mod;
mod.run = function(creep) {
    Creep.behaviour.ranger.heal.call(this, creep);
    return this.baseOf.internalViral.run.call(this, creep);
};
