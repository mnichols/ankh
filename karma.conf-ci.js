//https://github.com/saucelabs/karma-sauce-example
var fs = require('fs');

module.exports = function(config) {

    // Use ENV vars on Travis and sauce.json locally to get credentials
    if (!process.env.SAUCE_USERNAME) {
        if (!fs.existsSync('sauce.json')) {
            console.log('Create a sauce.json with your credentials based on the sauce-sample.json file.');
            process.exit(1);
        } else {
            process.env.SAUCE_USERNAME = require('./sauce').username;
            process.env.SAUCE_ACCESS_KEY = require('./sauce').accessKey;
        }
    }

    var tags = []
    if(process.env.TRAVIS_BRANCH) {
        tags.push(process.env.TRAVIS_BRANCH + ':' + process.TRAVIS_BUILD_NUMBER)
    }

    // Browsers to run on Sauce Labs
    var customLaunchers = {}
    /*
    //windows
    customLaunchers['SL_Win_IE_9']= {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        version: '9',
        platform: 'Windows 2008'
    }
    customLaunchers['SL_Win_IE_10'] = {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        version: '10',
        platform: 'Windows 2012'
    }
    customLaunchers['SL_Win_IE_11'] = {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        version: '11',
        platform: 'Windows 8.1'
    }
    customLaunchers['SL_Win_Chrome'] = {
        base: 'SauceLabs',
        browserName: 'chrome',
        platform: 'Windows 2008'
    }
    //osx
    customLaunchers['SL_MacOSX_Safari'] = {
        base: 'SauceLabs',
        browserName: 'safari',
        platform: 'OS X 10.9'
    }
    //ios
    customLaunchers['SL_IOS_Safari'] = {
        base: 'SauceLabs',
        browserName: 'iphone',
        platform: 'OS X 10.9',
        version:'7.1'
    }
    */
    //linux
    customLaunchers[ 'SL_Linux_Chrome'] = {
        base: 'SauceLabs',
        browserName: 'chrome',
        platform: 'Linux'
    }
    customLaunchers['SL_Linux_FireFox'] = {
        base: 'SauceLabs',
        browserName: 'firefox',
        platform: 'Linux'
    }

    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['browserify','mocha'],


        // list of files / patterns to load in the browser
        files: [
            'test/spec-support.js',
            'test/**/*-spec.js'
        ],


        // list of files to exclude
        exclude: [
        ],


        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            'test/spec-support.js': ['browserify']
        ,'test/**/*-spec.js': ['browserify']
        },

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['dots', 'saucelabs'],


        // web server port
        port: 9876,

        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        sauceLabs: {
            testName: 'ankh sauce tests'
            , recordScreenshots: false
            , recordVideo: true
            , tags: tags
            , build: process.env.TRAVIS_BUILD_NUMBER
            , connectOptions: {
                port: 5757
                , logfile: 'sauce_connect.log'
            }
        },
        captureTimeout: 240000,
        customLaunchers: customLaunchers,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: Object.keys(customLaunchers),
        autoWatch:false,
        singleRun: true,
        browserify: {
            debug: true
        }

    });
};
