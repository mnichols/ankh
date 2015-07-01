[ankh](https://github.com/mnichols/ankh)
<a href="https://github.com/mnichols/ankh"><img style="position: absolute; top: 0; right: 0; border: 0;" src="https://camo.githubusercontent.com/652c5b9acfaddf3a9c326fa6bde407b87f7be0f4/68747470733a2f2f73332e616d617a6f6e6177732e636f6d2f6769746875622f726962626f6e732f666f726b6d655f72696768745f6f72616e67655f6666373630302e706e67" alt="Fork me on GitHub" data-canonical-src="https://s3.amazonaws.com/github/ribbons/forkme_right_orange_ff7600.png"></a>
========
[![Build Status](https://travis-ci.org/mnichols/ankh.svg?branch=master)](https://travis-ci.org/mnichols/ankh)

## License
[MIT](https://raw.githubusercontent.com/mnichols/ankh/master/LICENSE)

Dependency Injection for JavaScript

## Overview

I missed an IoC container in JavaScript that let me control the lifestyle and lifecycle of
components. I couldn't find a library that gave me such granular control, so
I rolled my own.

## Install

`npm install --save ankh`

## Glossary

* *activator* the method to use for construction of an component
* *component* the 'thing' to resolve at runtime, regardless of whether it was constructed by `ankh` or not
* *lifecycle* the activation and resolution flow of construction a component
* *lifestyle* the duration of a components life in the container. 

## Components & lifestyle

Components may be constructed by `ankh`, or not. If they are then they will be managed
by `ankh` as configured by their 'lifestyle'. Components created by `ankh` are, by default,
`transient`; meaning you get a new instance for each resolution. `ankh` can 
guarantee a `singleton` instance when you register using `{ lifestyle: 'singleton'}`.

Components which are managed outside the container, such as `instance` or `value` registrations, 
will ignore any lifestyle directive.

## API

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

### Resolving components

#### Manual resolution

Typically, you won't manually resolve components, but of course during testing this
is useful. `ankh` will accept a second parameter object matching the key to the dependency to
override resolution. This is also great for testing for pushing mocks and the like
into your instances.

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
    .then(function(it) {
        //do things with 'svc'
    })

ankh.resolve('svc') // -> use 'BAR' for dep2 value
    .then(function(it) {
        //do things with svc
    })

```

#### Lifestyle : Start and startables (bootstrap)

`ankh` exposes a `start` method that can act as a bootstrapper for an application.
Components may participate in this lifecycle event by attaching an `startable` property
on the entity being registered. `ankh` will construct the instance (and resolve any
dependencies) and immediately invoke the method name provided by `startable`.

```js

Settings.startable = 'load'
function Settings() {

    return {
        load: function() {
            //do stuff
        }
    }
}
ankh.factory('settings',Settings)

ankh.start().then(...)

```

Sometimes you don't want to resolve the same dependencies during this period for a component,
so you may provide an `inject` array for the method in the same fashion as you
configure your component's dependencies.

```js

Settings.startable = 'load'
function Settings() {
    var spec = {
        load: function(cache) {
            //do stuff with cache
        }
    }
    spec.load.inject = ['localStorage']
    return spec
}

ankh.factory('settings',Settings)

ankh.start().then(...)

```

#### Lifestyle : Initializable

When `ankh` resolves a dependency it will invoke the method name provided by the
special `initializable` property on the registered entity. This happens _each time_
the component is resolved.

```js

User.initializable = 'fetchUser'
function User(xhr) {
    var spec =  {
        userName: undefined
        , fetchUser: function(xhr) {
            return xhr('profile')
                .bind(this)
                .tap(function(usr) {
                    this.userName = usr.name
                })
        }
    }
    spec.inject = ['xhr']
    return spec
}

Settings.inject = ['user']
function Settings(user) {
    return {
        sayHi: function() {
            console.log('hi',user.userName) 
        }
    }
}

```

#### Deferrables

Sometimes a component needs to defer construction of a dependency. This can come up when:

* Multiple instances of the same dependency are desired, but may not be registered with unique names
* Some action should take place before the dependency is meaningful (rare)
* A dynamic configuration should be used to override a dependency of the dependency (rarer)

In all these cases, I prefer being explicit about such needs and register that behavior as 
a component itself. However sometimes that isn't warranted or possible.

To that end, `ankh` exposes a `deferrable` method that accepts the `key` of the service
you want to make deferrable and an (optional) key to name the resulting component. If you don't 
provide a name, it will use `{serviceName}Deferred` by convention. Behind the scenes
`ankh` is merely putting the service behind a function closure and forwarding arguments
to defer it's construction on-demand.

```js

Settings.inject = ['localStorage']
function Settings(cache) {

}
ankh.factory('settings',Settings)
ankh.deferrable('settings')

Login.inject = ['settingsDeferred'] //the special sauce
function Login(settingsDeferred) {
    return {
        localCache: {}
        , signin: function() {
            //settingsDeferred is a function
            //you can even provide your own overrides
            return settingsDeferred({ cache: this.localCache })
                .then(function(settings) {
                    //do stuff with new instance
                })

        }
    }
}

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

Run `make view-docs` to see pretty documentation

## Example

There is an example of creating and using the `ankh` container in the `/examples` folder.

## Tests

`ankh` uses [karma](http://karma-runner.github.io/0.12/index.html).
You can `make test` to runem.


#### Thanks and Inspirations

The work here is heavily influenced from the IoC concepts found in Castle Project's
[Windsor Inversion of Control Container](https://github.com/castleproject/Windsor).

The success of [Angular](https://angularjs.org/) demonstrated for me that this is one of those patterns that
belongs in dynamic language world just as much as it does in static lang.


