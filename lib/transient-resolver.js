'use strict';

module.exports = TransientResolver

//TransientResolver.inject = ['model']
/**
 * Do not cache the resolved instance
 * */
function TransientResolver() {
}
TransientResolver.prototype.resolve = function(context, deps){
    var model = context.model
        ,activator = context.activator
    ;
    return activator.activate(model,deps)
}
