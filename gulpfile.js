var gulp = require('gulp')
    , $ = require('gulp-load-plugins')()
    , browserify = require('browserify')
    , vinyl = require('vinyl-source-stream')
    , fs = require('fs')
    , glob = require('glob')
    , path = require('path')
    , url = require('url')
    , util = require('util')
    , mkdirp = require('mkdirp')
    , watchify = require('watchify')
    ;


gulp.task('default',['test'])


// Clean dist directory
gulp.task('clean', function () {
    return gulp.src('./build', { read: false })
        .pipe($.rimraf())
})

// JSHint the source files
gulp.task('jshint', function () {
    return gulp.src(['./lib/*.js','./test/*-spec.js'])
        .pipe($.jshint())
        .pipe($.jshint.reporter('default'))
        .pipe($.jshint.reporter('fail'))
        .on('error', gulp.fail)
})

gulp.task('test',['clean'],function(){
    var specFiles = './test/*-spec.js'
    var tests = glob.sync(specFiles)
    tests.unshift('./test/spec-support.js')
    var b = browserify({
        entries: tests
    })
    return b.bundle({ debug: true })
        .pipe(vinyl('specs.js'))
        .pipe(gulp.dest('./build'))

})
gulp.task('watch',['test'],function(){

    gulp.watch([
        './lib/**/*.js'
        ,'./test/**/*.js'
    ]
    ,['test'])
})


// Helper method to kill the gulp task on error
gulp.fail = function(err) {
    console.log(err)
    process.exit(1)
}
