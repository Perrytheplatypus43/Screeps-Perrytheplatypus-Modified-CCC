const mod = {
    
    extend() {
        this.baseOf.internalViral.extend.call(this);
    
        Room.prototype.prepareResourceOrder = function(containerId, resourceType, amount) {
            let container = Game.getObjectById(containerId);
            if (!this.my || !container || !container.room.name == this.name ||
                !(container.structureType == STRUCTURE_LAB ||
                container.structureType == STRUCTURE_POWER_SPAWN ||
                container.structureType == STRUCTURE_NUKER ||
                container.structureType == STRUCTURE_CONTAINER ||
                container.structureType == STRUCTURE_STORAGE ||
                container.structureType == STRUCTURE_TERMINAL)) {
                return ERR_INVALID_TARGET;
            }
            if (!RESOURCES_ALL.includes(resourceType)) {
                return ERR_INVALID_ARGS;
            }
            if (this.memory.resources === undefined) {
                this.memory.resources = {
                    lab: [],
                    powerSpawn: [],
                    nuker: [],
                    container: [],
                    terminal: [],
                    storage: [],
                };
            }
            if (this.memory.resources.powerSpawn === undefined) this.memory.resources.powerSpawn = [];
            if (this.memory.resources.nuker === undefined) this.memory.resources.nuker = [];
            if (!this.memory.resources[container.structureType].find( (s) => s.id == containerId )) {
                this.memory.resources[container.structureType].push(container.structureType==STRUCTURE_LAB ? {
                    id: containerId,
                    orders: [],
                    reactionState: LAB_IDLE,
                } : {
                    id: containerId,
                    orders: [],
                });
            }
            if (container.structureType == STRUCTURE_LAB && resourceType != RESOURCE_ENERGY && amount > 0) {
                // clear other resource types since labs only hold one at a time
                let orders = this.memory.resources[STRUCTURE_LAB].find((s)=>s.id==containerId).orders;
                for (var i=0;i<orders.length;i++) {
                    if (orders[i].type != resourceType && orders[i].type != RESOURCE_ENERGY) {
                        orders[i].orderAmount = 0;
                        orders[i].orderRemaining = 0;
                        orders[i].storeAmount = 0;
                    }
                }
            }
            return OK;
        };
    
        Room.prototype.updateResourceOrders = function() {
            let data = this.memory.resources;
            if (!this.my || !data) return;
        
            // go through reallacation orders and reset completed orders
            for(var structureType in data) {
                for(var i=0;i<data[structureType].length;i++) {
                    let structure = data[structureType][i];
                    // don't reset busy labs
                    if (structureType == STRUCTURE_LAB && structure.reactionState != LAB_IDLE) continue;
                    if (!structure.orders) continue;
                    for(var j=0;j<structure.orders.length;j++) {
                        let order = structure.orders[j];
                        if (order.orderRemaining <= 0) {
                            let baseAmount = 0;
                            let rcl = this.controller.level;
                            if (structureType == STRUCTURE_STORAGE) baseAmount = order.type == RESOURCE_ENERGY ? MIN_STORAGE_ENERGY[rcl] : MAX_STORAGE_MINERAL;
                            else if (structureType == STRUCTURE_TERMINAL) baseAmount = order.type == RESOURCE_ENERGY ? TERMINAL_ENERGY : 0;
                            baseAmount += order.storeAmount;
                            let amount = 0;
                            let cont = Game.getObjectById(structure.id);
                            if (cont && structureType == STRUCTURE_LAB) {
                                switch (structureType) {
                                    case STRUCTURE_LAB:
                                        // get lab amount
                                        if (order.type == cont.mineralType) {
                                            amount = cont.mineralAmount;
                                        } else if (order.type == RESOURCE_ENERGY) {
                                            amount = cont.energy;
                                        }
                                        break;
                                    case STRUCTURE_POWER_SPAWN:
                                        // get power spawn amount
                                        if (order.type == RESOURCE_POWER) {
                                            amount = cont.power;
                                        } else if (order.type == RESOURCE_ENERGY) {
                                            amount = cont.energy;
                                        }
                                        break;
                                    case STRUCTURE_NUKER:
                                        // get nuker amount
                                        if (order.type == RESOURCE_GHODIUM) {
                                            amount = cont.ghodium;
                                        } else if (order.type == RESOURCE_ENERGY) {
                                            amount = cont.energy;
                                        }
                                        break;
                                    default:
                                        // get stored amount
                                        amount = cont.store[order.type] || 0;
                                        break;
                                }
                            }
                            if (amount < baseAmount) {
                                order.orderAmount = 0;
                                order.orderRemaining = 0;
                            }
                        }
                    }
                }
            }
        };
    }
    
};
module.exports = mod;