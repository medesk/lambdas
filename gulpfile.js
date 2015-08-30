var Q      = require("q")
var fs     = require("fs-extra")
var path   = require("path")
var gulp   = require("gulp")
var seq    = require("run-sequence")
var zip    = require("gulp-zip")
var tsd    = require('gulp-tsd')
var ts     = require("gulp-typescript")


var DIR_ROOT  = __dirname
var DIR_PKG   = path.join(DIR_ROOT, "pkg")

// AWS Lambda package
var COPY = [
  [ path.join(DIR_ROOT, "node_modules", "q"), path.join(DIR_PKG, "node_modules", "q"), "dir" ],
  [ path.join(DIR_ROOT, "build/src/main.js"), path.join(DIR_PKG, "main.js"), "file" ]
]

gulp.task("tsd", function (cb) {
  tsd({
    command: "reinstall",
    config: "./tsd.json",
    latest: true
  }, cb)
});

gulp.task("clean", function(cb){
  fs.removeSync("build")
  fs.removeSync("pkg")
  cb()
})

gulp.task('compile', function() {
  var project = ts.createProject('tsconfig.json')
  return project.src()
    .pipe(ts(project))
    .js
    .pipe(gulp.dest(path.join(DIR_ROOT, "build")))
});

gulp.task('packaging', function(){
  // Make destination folders
  COPY.forEach(function(l){
    fs.mkdirpSync(l[2] === "dir" ? l[1] : path.dirname(l[1]))
    fs.copySync(l[0], l[1])
  })


  return gulp.src(path.join(DIR_PKG, "**/*"))
    .pipe(zip('lambda-pkg.zip'))
    .pipe(gulp.dest(DIR_PKG));
})

gulp.task("build", function(cb){
  return seq("clean", "tsd", "compile", "packaging", cb)
})
