let mod = {};
module.exports = mod;
mod.heal = function(creep) {
    Creep.behaviour.ranger.heal.call(this, creep);
};
