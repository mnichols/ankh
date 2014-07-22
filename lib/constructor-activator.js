'use strict';

module.exports = ConstructorActivator
function ConstructorActivator() {
}
ConstructorActivator.prototype.activate = function create(model, args) {
    var Constructor = model.impl
    var result = Object.create(Constructor.prototype)
    if(!result) {
        var msg = 'Component couldnt be created for:`' + model.key + '`'
        return Promise.reject(new Error(msg))
    }
    Constructor.apply(result,args || [])
    return Promise.resolve(result)
}

