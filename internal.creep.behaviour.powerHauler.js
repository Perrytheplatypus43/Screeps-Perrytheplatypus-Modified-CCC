const mod = new Creep.Behaviour('powerHauler');
module.exports = mod;
mod.nextAction = function(creep) {
    // at home
    if( creep.pos.roomName == creep.data.homeRoom ){
        // carrier filled
        if( creep.sum > 0 ){
            let deposit = []; // deposit energy in...
            // storage?
            if( creep.room.storage ) deposit.push(creep.room.storage);
            
            // Choose the closest
            if( deposit.length > 0 ){
                let target = creep.pos.findClosestByRange(deposit);
                if( target.structureType == STRUCTURE_STORAGE && this.assignAction(creep, 'storing') ) return;
                else if( this.assignAction(creep, 'charging', target) ) return;
            }
            if( this.assignAction(creep, 'charging') ) return;
            // no deposit :/ 
            // try spawn & extensions
            if( this.assignAction(creep, 'feeding') ) return;
            this.assignAction(creep, 'dropping');
            return;
        }
        // empty
        // travelling
        if (this.gotoTargetRoom(creep)) {
            return;
        }
    }
    // at target room
 else if (creep.data.destiny.room == creep.pos.roomName) {
        // TODO: This should perhaps check which distance is greater and make this decision based on that plus its load size
        if (creep.sum / creep.carryCapacity > 0.01) {
            this.goHome(creep);
            return;
        }
        if (this.assignAction(creep, 'pickPower')) return;
        // wait
        if ( creep.sum === 0 ) {
            let target = FlagDir.find(FLAG_COLOR.powerMining, creep.pos, true);
            if (creep.room && target && creep.pos.getRangeTo(target) > 3) {
                creep.data.travelRange = 3;
                return this.assignAction(creep, 'travelling', target);
            }
        }
        return this.assignAction(creep, 'idle');
    }
    // somewhere
    else {
        let ret = false;
        // TODO: This should perhaps check which distance is greater and make this decision based on that plus its load size
        if( creep.sum / creep.carryCapacity > 0.01 )
            ret = this.goHome(creep);
        else
            ret = this.gotoTargetRoom(creep);
        if (ret) {
            return;
        }
    }
    // fallback
    // recycle self
    let mother = Game.spawns[creep.data.motherSpawn];
    if( mother ) {
        this.assignAction(creep, 'recycling', mother);
    }
};
mod.gotoTargetRoom = function(creep){
    const targetFlag = creep.data.destiny ? Game.flags[creep.data.destiny.targetName] : null;
    if (targetFlag) return Creep.action.travelling.assignRoom(creep, targetFlag.pos.roomName);
};
mod.goHome = function(creep){
    return this.assignAction(creep, 'travelling', Game.rooms[creep.data.homeRoom].storage);
};
