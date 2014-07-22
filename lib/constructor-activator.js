'use strict';

module.exports = CtorActivator
function CtorActivator() {
}
CtorActivator.prototype.activate = function create(args, context) {
    var Ctor = this.cfg.impl
    var result = Object.create(Ctor.prototype)
    if(!result) {
        var msg = 'Component couldnt be created for:`' + this.cfg.key + '`'
        return Promise.reject(new Error(msg))
    }
    Ctor.apply(result,args || [])
    return Promise.resolve(result)
}

