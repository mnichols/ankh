'use strict';

/**
 * Convenience method for registering components, given a function
 * The first arg must be a function, additional args are optional
 * @example
 * //my-module.js
 * module.exports = function buildModule(ankh,arg1, arg2) {
 *     ankh.factory('foo',require('./foo'))
 * }
 *
 * // ankher.js
 * var ankh = new Ankh()
 * var ankh.registerAll = require('ankh/register-all')
 * ankh.registerAll(require('./my-module')) // => foo is registered
 * @return {Any} the result of the `fn` parameter
 * */
module.exports = function registerAll(fn) {
    //`this` is the ankh instance
    var args = [].slice.call(arguments)
    fn = args.shift()
    args.unshift(this)
    if(!fn) {
        throw new Error('fn is required')
    }
    //pass along any additional arguments which were provided
    return fn.apply(this,args)
}
