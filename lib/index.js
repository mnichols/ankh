'use strict';

var Kernel = require('./kernel')
    ,ComponentModel = require('./component-model')
    ,clone = require('clone')
    ;
module.exports = Ankh

/**
 * The primary object for interacting with the container.
 * @class Ankh
 * */
function Ankh(kernel) {
    Object.defineProperty(this,'kernel',{
        value: (kernel || new Kernel())
        ,configurable: false
        ,writable: false
        ,enumerable: true
    })
}

/**
 * Registers a factory on the kernel. By default, this will be registered as a `transient` instance. Use the `cfg.lifestyle` configuration to
 * declare otherwise; eg { lifestyle: 'singleton'}
 * @method factory
 * @memberof Ankh
 * @instance
 * @param {String} key The service key; will overwrite existing keys
 * @param {Any} impl The implementation to resolve
 * @param {Object} [cfg] The configuration for the {ComponentModel}
 * @return {Ankh} this instance
 */
Ankh.prototype.factory = function(key, impl, cfg) {
    cfg = (cfg || {})
    var model = new ComponentModel(key, impl, cfg)
    model.activator(cfg.activator || '@factory')
    model.resolver(cfg.resolver || (cfg.lifestyle === 'singleton' ? '@cacheable' : '@transient'))
    this.kernel.register(model)
    return this
}
/**
 * Registers a constructor/prototype on the kernel. By default, this will be registered as a `transient` instance. Use the `cfg.lifestyle` configuration to
 * declare otherwise; eg { lifestyle: 'singleton'}
 * @method factory
 * @memberof Ankh
 * @instance
 * @param {String} key The service key; will overwrite existing keys
 * @param {Any} impl The implementation to resolve
 * @param {Object} [cfg] The configuration for the {ComponentModel}
 * @return {Ankh} this instance
 */
Ankh.prototype.ctor = function(key, impl, cfg) {
    cfg = (cfg || {})
    var model = new ComponentModel(key, impl, cfg)
        ;

    model.activator(cfg.activator || '@constructor')
    model.resolver(cfg.resolver || (cfg.lifestyle === 'singleton' ? '@cacheable' : '@transient'))
    this.kernel.register(model)
    return this
}
/**
 * Registers a value on the kernel. This will deep clone the passed in `impl` and resolve that value each time. Lifestyle is irrelevant here.
 * @method factory
 * @memberof Ankh
 * @instance
 * @param {String} key The service key; will overwrite existing keys
 * @param {Any} impl The implementation to resolve
 * @param {Object} [cfg] The configuration for the {ComponentModel}
 * @return {Ankh} this instance
 */
Ankh.prototype.value = function(key, impl,cfg) {
    cfg = (cfg || {})
    var model = new ComponentModel(key, clone(impl), cfg)
    model.activator(cfg.activator || '@impl')
    model.resolver(cfg.resolver || '@impl')
    this.kernel.register(model)
    return this
}
/**
 * Registers an instance (reference) on the kernel. This will simply resolve the `impl` and resolve that aach time. Lifestyle is irrelevant here.
 * This is handy for putting third-party libs into the container.
 * @method factory
 * @memberof Ankh
 * @instance
 * @param {String} key The service key; will overwrite existing keys
 * @param {Any} impl The implementation to resolve
 * @param {Object} [cfg] The configuration for the {ComponentModel}
 * @return {Ankh} this instance
 */
Ankh.prototype.instance = function(key, impl, cfg) {
    cfg = (cfg || {})
    var model = new ComponentModel(key, impl, cfg)
    model.activator(cfg.activator || '@impl')
    model.resolver(cfg.resolver || '@impl')
    this.kernel.register(model)
    return this
}
/**
 * Sets up a service to decorate another service's _instance_.
 * So given service 'A', you can declare service 'B' to decorate all instances of the resolved 'A' services.
 * To receive the decorated instance into your decorator, you must use the special key '@impl' in your `inject` array.
 * @method decorate
 * @memberof Ankh
 * @instance
 * @param {String} targetKey the service to decorate
 * @param {String} decoratorKey the service to use for decorating
 * @return {Ankh} this instance
 * */
Ankh.prototype.decorate = function(targetKey, decoratorKey) {
    this.kernel.decorate(targetKey, decoratorKey)
    return this
}
/**
 * Resolves a service by `key` while injecting dynamically the dependencies found in `deps`
 * @method resolve
 * @memberof Ankh
 * @instance
 * @param {String} key The service key
 * @param {Object} deps Key/value map of dynamic values to use during resolution. These keys map to the `inject` values
 * found on the service implementation (impl). Be very careful here since if your service is a `singleton` and you pass in
 * dynamic values, those values will persist for all future resolutions of the dependency.
 * @return {Ankh} this instance
 * */
Ankh.prototype.resolve = function(key,deps) {
    this.kernel.resolve(key,deps)
    return this
}
/**
 * Starts the container, validating the registrations and executing `startable` components
 * @method start
 * @memberof Ankh
 * @instance
 * @return {Promise} resolving this instance of the container
 * */
Ankh.prototype.start = function(){
    return this.kernel.start()
        .then(function(){
            return this
        })
}
/**
 * Factory method for creating an container.
 * @method create
 * @return {Ankh} new instance
 * */
Ankh.create = function() {
    return new Ankh()
}
