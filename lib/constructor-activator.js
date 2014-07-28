'use strict';

var dynamicNew = require('./dynamic-new')

module.exports = ConstructorActivator
function ConstructorActivator() {
}
ConstructorActivator.prototype.activate = function create(model, args) {
    return dynamicNew(model.impl,args)
}

