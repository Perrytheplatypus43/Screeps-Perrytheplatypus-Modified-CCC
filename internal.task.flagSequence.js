// This task will react on sequence goal flags (Gray/Gray), changing the color of trigger flags (Gray/x) to (x/x) flags.
"use strict";
let mod = {};
module.exports = mod;

// Goal flag: Gray/Gray, checks for a condition.
// Trigger flag: Gray/X, if a goal is reached, change the colors of the trigger flags
//               the trigger flag changes its color to X/X
//               E.g. A Gray/green flag will change to a green/green flag, sending claimers.

// Memory:
//  Goal Flag:
//      goal: one of:
//          "destroy": checks if there is no structure at the flag position.
//  Trigger Flag:
//      goal: (optional) the name of a goal flag.

// hook into flag events
mod.register = () => {};

// for each flag
mod.handleFlagFound = flag => {
    if ( flag.color == FLAG_COLOR.sequence.color && flag.secondaryColor == FLAG_COLOR.sequence.secondaryColor ) {
        Task.flagSequence.checkTrigger(flag);
    }
};

// check if the condition was fulfilled.
mod.checkTrigger = flag => {
    let mem = flag.memory;
    if ( mem.check === undefined ) {
        if ( !flag.room ) return;
        let structures = flag.room.lookForAt(LOOK_STRUCTURES, flag);
        if ( structures.length > 0 ) {
            mem.check = "destroy";
            // TODO: check for controller here, make a RCL goal.
        } else {
            // Check for possible other triggers here
            // TODO
        }
        flag.memory.check = "destroy";
    } else if ( mem.check == "destroy" ) {
        let structures = flag.room.lookForAt(LOOK_STRUCTURES, flag);
        if ( structures.length == 0 ) {
            Task.flagSequence.trigger( flag )
        }
    }
};

mod.trigger = goalflag => {
    let name = goalflag.name;
    let flags = FlagDir.filterCustom( {
        color: FLAG_COLOR.sequence.color,
    } );
    flags.forEach( flag => {
        let realFlag = Game.flags[flag.name];
        if ( realFlag == goalflag ) return;
        let mem = realFlag.memory;
        if ( mem.goal !== undefined && mem.goal !== name ) return;
        // TODO: implement other actions like building.
        let sec = flag.secondaryColor;
        if ( sec == FLAG_COLOR.sequence.color ) {
            // TODO: chaining - only trigger flag AFTER an other goal rached.
            return;
        }
        if ( mem.secondaryColor !== undefined ) {
            sec = mem.secondaryColor;
        }
        realFlag.setColor(flag.secondaryColor, sec);
        return;
    } );
    
    goalflag.remove();
}

// TODO: helper procedures, like trigger flags without goal flags.
