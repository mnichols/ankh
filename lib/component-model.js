'use strict';

module.exports = ComponentModel

function ComponentModel(key, impl, cfg) {
    this.key = key
    this.impl =impl
    this._cfg = cfg || {}
    this.inject = this.impl.inject
    this.initializable = (this.impl.initializable || false)
    this.startable = (this.impl.startable || false)
}
ComponentModel.prototype.resolver = function(val) {
    if(val) {
        this._resolver = val
    }
    return this._resolver
}

ComponentModel.prototype.activator = function(val) {
    if(val) {
        this._activator = val
    }
    return this._activator
}

