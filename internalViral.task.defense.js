let mod = {};
module.exports = mod;
mod.creep = {
    defender: {
        fixedBody: [ATTACK, MOVE],
        multiBody: [TOUGH, ATTACK, RANGED_ATTACK, HEAL, MOVE, MOVE],
        name: "defender", 
        behaviour: "warrior", 
        queue: 'Low'
    },
};
