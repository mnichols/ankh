'use strict';

var Kernel = require('./kernel')
    ,ComponentModel = require('./component-model')
    ,clone = require('clone')
    ;
module.exports = Ankh

function Ankh(kernel) {
    Object.defineProperty(this,'kernel',{
        value: (kernel || new Kernel())
        ,configurable: false
        ,writable: false
        ,enumerable: true
    })
}

Ankh.prototype.factory = function(key, impl, cfg) {
    cfg = (cfg || {})
    var model = new ComponentModel(key, impl, cfg)
    model.activator(cfg.activator || '@factory')
    model.resolver(cfg.resolver || (cfg.lifestyle === 'singleton' ? '@cacheable' : '@transient'))
    this.kernel.register(model)
    return this
}
Ankh.prototype.ctor = function(key, impl, cfg) {
    cfg = (cfg || {})
    var model = new ComponentModel(key, impl, cfg)
        ;

    model.activator(cfg.activator || '@constructor')
    model.resolver(cfg.resolver || (cfg.lifestyle === 'singleton' ? '@cacheable' : '@transient'))
    this.kernel.register(model)
    return this
}
Ankh.prototype.value = function(key, impl,cfg) {
    cfg = (cfg || {})
    var model = new ComponentModel(key, clone(impl), cfg)
    model.activator(cfg.activator || '@impl')
    model.resolver(cfg.resolver || '@impl')
    this.kernel.register(model)
    return this
}
Ankh.prototype.instance = function(key, impl, cfg) {
    cfg = (cfg || {})
    var model = new ComponentModel(key, impl, cfg)
    model.activator(cfg.activator || '@impl')
    model.resolver(cfg.resolver || '@impl')
    this.kernel.register(model)
    return this
}
Ankh.prototype.decorate = function(targetKey, decoratorKey) {
    return this.kernel.decorate(targetKey, decoratorKey)
}
Ankh.prototype.resolve = function(key,deps) {
    return this.kernel.resolve(key,deps)
}
Ankh.prototype.start = function(){
    return this.kernel.start()
        .then(function(){
            return this
        })
}
Ankh.create = function() {
    return new Ankh()
}
