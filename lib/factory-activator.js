'use strict';

module.exports = FactoryActivator

function FactoryActivator() {
}
FactoryActivator.prototype.activate = function(model,args) {
    var Ctor = model.impl
    var result = Ctor.apply(this, args || [])
    if(!result) {
        var msg = 'Factory couldnt be created for:`' + model.key + '`'
        throw new Error(msg)
    }
    return result
}

