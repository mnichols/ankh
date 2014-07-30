'use strict';

module.exports = ComponentModel

/**
 * Describes the model for resolving a service
 * @class ComponentModel
 **/
function ComponentModel(key, impl, cfg) {
    this.key = key
    /**
     * @property {Any} impl The implementation to use for `resolve`
     * */
    this.impl =impl
    this._cfg = cfg || {}
    /**
     * @property {Array} inject The {String} dependencies array a service may declare
     * */
    this.inject = (this.impl.inject || [])
    /**
     * @property {String} initializable The method to invoke on an resolved service just after resolution, but before returning
     * injecting any dependencies found on that method
     * */
    this.initializable = (this.impl.initializable || false)
    /**
     * @property {String} startable The method to invoke on an resolved services when started. Usually during an app bootstrap.
     * */
    this.startable = (this.impl.startable || false)
}
/**
 * get/set the resolver service key
 * @method resolver
 * @param {String} [val] When provided, acts as a `setter` for the resolver
 * @return {String} The key for the resolver to use
 * */
ComponentModel.prototype.resolver = function(val) {
    if(val) {
        this._resolver = val
    }
    return this._resolver
}

/**
 * get/set the activator service key
 * @method activator
 * @param {String} [val] When provided, acts as a `setter` for the activator
 * @return {String} The key for the activator to use
 * */
ComponentModel.prototype.activator = function(val) {
    if(val) {
        this._activator = val
    }
    return this._activator
}

