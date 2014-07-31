ankh
========

Dependency Injection for JavaScript

## Overview

After moving to JavaScript, I missed an IoC container that let me control the lifestyle and lifecycle of
components. I couldn't find a library that gave me such granular control, so
I rolled my own.

## Install

`npm install --save ankh`

## Usage

### Registering components

#### Register a singleton factory

```js
var Ankh = require('ankh')
var ankh = new Ankh()

//register a singleton factory

HandlerFactory.inject = ['http']
function HandlerFactory(http) {
    return function handle(command) {
        return http(...)
    }
}

ankh.factory('handlerFactory',HandlerFactory, {
    lifestyle: 'singleton'
})

```

#### Register a transient (default) prototype

```js
//register a prototype

Issue.inject = ['cfg']
function Issue(cfg) {
    this.cfg = cfg

}
Issue.prototype.doIt = function(){}

ankh.ctor('issue',Issue, {
    lifestyle: 'transient'
})


```

#### Register a value

```js

//note that this clones the value, so changes to the object are not reflected
//in the container
var cfg = { root: '/api'}
ankh.value('cfg',cfg)
```

#### Register an instance

```js
ankh.instance('bluebird',require('bluebird'))
```

#### Register an decorator

````js
//first register your services
// with '@impl' as a special key for the instance you want to decorate
MyDecoratingService.inject = ['@impl']
function MyDecoratingService(impl){
    //do things to the instance
    //return whatever you want
}
ankh.factory('myTargetService',function(){})
ankh.factory('myDecoratingService',MyDecoratingService)

//register the decoration
ankh.decorate('myTargetService','myDecoratingService')
```

#### Resolve a service

```js

MyService.inject = ['dep1','dep2']
function MyService(dep1,dep2) {
    
}

//register
ankh.value('dep1','FOO')
ankh.value('dep2','BAR')
ankh.ctor('svc',MyService)

//resolve
ankh.resolve('svc',{ dep2: 'BAZ'}) // -> use 'BAZ' for dep2 value
ankh.resolve('svc') // -> use 'BAR' for dep2 value

```

### Validating the container for acyclic dependencies (experimental)

`ankh` tries hard to tell you if the container has cyclic dependencies.
Decorators _can_ be difficult to detect this.

```js

try {
    var graph  = ankh.validate() // if OK then an array of execution order is returned
} catch(err) {
    //otherwise an error is throw trying to identify failure
}

```

## Docs

Run `make docs` to see pretty documentation

## Tests

`ankh` uses [testem](https://github.com/airportyh/testem).
You can `make test` to runem.


### CHANGELOG

* `0.0.2` Settled API
* `0.0.3` Some documentation

#### Thanks and Inspirations

The work here is heavily influenced from the IoC concepts found in Castle Project's
[Windsor Inversion of Control Container](https://github.com/castleproject/Windsor).

The popularity of [Angular](https://angularjs.org/) demonstrated for me that this is one of those patterns that
belongs in dynamic language world just as much as it does in static lang.


