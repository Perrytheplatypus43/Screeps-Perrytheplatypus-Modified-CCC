const mod = {};
module.exports = mod;
mod.newTarget = function (creep) {
    let fuelable = _.filter(creep.room.structures.fuelable, t =>
        Creep.action.fueling.isValidTarget(t) && Creep.action.fueling.isAddableTarget(t));
    if (fuelable.length) {
        const urgent = _.filter(fuelable, t => t.energy <= 100);
        if (urgent.length) {
            fuelable = urgent;
        }
        return creep.pos.findClosestByRange(fuelable);
    }
};
