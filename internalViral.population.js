let mod = {};
module.exports = mod;
/* maininjection:
mod.stats.creep.armorParts = ...
 */
// 3 layers: armor (combat buffer), hull (movement buffer), core
// depending on shape core parts may count as armor
mod.getCombatStats = function(body) {
    let i = 0;

    let armor = 99;
    let hullHits = body.length * 100 - 99;
    for(;i < body.length - 1; i++) {
        if (!Population.stats.creep.armorParts[body[i].type]) {
            break;
        }
        armor = armor + (Population.stats.creep.boost.hits[body[i].boost] || 100);
        hullHits = hullHits - 100;
    }

    let hull = armor;
    let coreHits = hullHits;

    if (i === body.length - 1) {
        for (; i >= 0; i--) {
            if (body[i].type !== MOVE && !Population.stats.creep.coreParts[body[i].type]) {
                break;
            }
            armor = armor - 100;
            hullHits = hullHits + 100;
        }
    } else {
        for (; i < body.length; i++) {
            if (Population.stats.creep.coreParts[body[i].type]) {
                break;
            }
            hull = hull + (Population.stats.creep.boost.hits[body[i].boost] || 100);
            coreHits = coreHits - 100;
        }
    }

    return { armor, hullHits, hull, coreHits };
};

mod.stats = {
    creep: {
        armorParts: { // combat buffer
            [TOUGH]: true,
            [MOVE]: true,
            [CARRY]: true,
        },
        coreParts: { // run away
            [MOVE]: true,
            [HEAL]: true,
        },
    },
};