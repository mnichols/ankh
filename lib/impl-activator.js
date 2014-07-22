'use strict';

module.exports = ImplActivator

function ImplActivator(){

}
ImplActivator.prototype.activate = function(model, args) {
    return model.impl
}
