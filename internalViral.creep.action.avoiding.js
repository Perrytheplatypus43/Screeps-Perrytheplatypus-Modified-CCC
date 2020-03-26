const mod = {};
module.exports = mod;
mod.work = function(creep) {
    Creep.behaviour.ranger.heal(creep);

    return this.baseOf.internalViral.work.apply(this, [creep]);
};
