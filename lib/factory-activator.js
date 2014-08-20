'use strict';

module.exports = FactoryActivator

function FactoryActivator() {
}
FactoryActivator.prototype.activate = function(model,args) {
    var Ctor = model.impl
    var result = Ctor.apply(this, args || [])
    if(typeof(result) === 'undefined' || result == null) {
        var msg = 'Factory could not create `' + model.key + '`.\n' +
            'This is likely due to returning `undefined` or `null` from a factory.'
        throw new Error(msg)
    }

    return result
}

