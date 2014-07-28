'use strict';

var Kernel = require('./kernel')
    ,ComponentModel = require('./component-model')
    ,clone = require('clone')
    ;
module.exports = Implants

function Implants(kernel) {
    Object.defineProperty(this,'kernel',{
        value: (kernel || new Kernel())
        ,configurable: false
        ,writable: false
        ,enumerable: true
    })
}

Implants.prototype.factory = function(key, impl, cfg) {
    cfg = (cfg || {})
    var model = new ComponentModel(key, impl, cfg)
    model.activator(cfg.activator || '@factory')
    model.resolver(cfg.resolver || (cfg.lifestyle === 'singleton' ? '@cacheable' : '@transient'))
    this.kernel.register(model)
    return this
}
Implants.prototype.ctor = function(key, impl, cfg) {
    cfg = (cfg || {})
    var model = new ComponentModel(key, impl, cfg)
        ;

    model.activator(cfg.activator || '@constructor')
    model.resolver(cfg.resolver || (cfg.lifestyle === 'singleton' ? '@cacheable' : '@transient'))
    this.kernel.register(model)
    return this
}
Implants.prototype.value = function(key, impl,cfg) {
    cfg = (cfg || {})
    var model = new ComponentModel(key, clone(impl), cfg)
    model.activator(cfg.activator || '@impl')
    model.resolver(cfg.resolver || '@impl')
    this.kernel.register(model)
    return this
}
Implants.prototype.instance = function(key, impl, cfg) {
    cfg = (cfg || {})
    var model = new ComponentModel(key, impl, cfg)
    model.activator(cfg.activator || '@impl')
    model.resolver(cfg.resolver || '@impl')
    this.kernel.register(model)
    return this
}
Implants.prototype.decorate = function(targetKey, decoratorKey) {
    return this.kernel.decorate(targetKey, decoratorKey)
}
Implants.prototype.resolve = function(key,deps) {
    return this.kernel.resolve(key,deps)
}
Implants.prototype.start = function(){
    return this.kernel.start()
        .then(function(){
            return this
        })
}
Implants.create = function() {
    return new Implants()
}
