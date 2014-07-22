'use strict';

var Kernel = require('./kernel')
    ,ComponentModel = require('./component-model')
module.exports = Implants




function Implants() {
    this.kernel = new Kernel()
}

Implants.prototype.factory = function(key, impl, cfg) {
    cfg = (cfg || {})
    var model = new ComponentModel(key, impl, cfg)
    model.activator('@factory')
    model.resolver(cfg.lifestyle === 'singleton' ? '@cacheable' : '@transient')
    this.kernel.register(model)
    return this
}
Implants.prototype.decorate = function(target, decorator) {
    return this.kernel.decorate(target, decorator)
}
Implants.prototype.resolve = function(key,deps) {
    return this.kernel.resolve(key,deps)
}
Implants.prototype.bind  = function() {
    return this.kernel.bind()
}
Implants.create = function() {
    return new Implants()
}
