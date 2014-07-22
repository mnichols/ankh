'use strict';

module.exports = ComponentModel

function ComponentModel(key, impl, cfg) {
    this.key = key
    this.impl =impl
    this._cfg = cfg || {}
    this.inject = this.impl.inject
}
ComponentModel.prototype.resolver = function(val) {
    console.log('val',val)
    if(val) {
        this._resolver = val
    }
    if(!this._resolve) {
        throw new Error('resolver has not been assigned for:' + this.key)
    }
    return this._resolver
}

ComponentModel.prototype.activator = function(val) {
    if(val) {
        this._activator = val
    }
    if(!this._activator) {
        throw new Error('activator has not been assigned for:' + this.key)
    }
    return this._activator
}

