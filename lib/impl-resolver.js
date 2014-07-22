'use strict';

module.exports = ImplResolver

/**
 * Resolve the implementation directly, without attempting
 * to invoke it for resolution
 * */
function ImplResolver() {
}
ImplResolver.prototype.resolve = function(context, deps){
    return context.model.impl
}

