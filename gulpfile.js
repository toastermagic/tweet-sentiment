/*eslint-env node*/

"use strict";

// Include promise polyfill for node 0.10 compatibility
require("es6-promise").polyfill();

// Include Gulp & tools we"ll use
var gulp = require("gulp");
var $ = require("gulp-load-plugins")();
var del = require("del");
var runSequence = require("run-sequence");
var merge = require("merge-stream");
var path = require("path");
var fs = require("fs");
var glob = require("glob-all");
var packageJson = require("./package.json");
var crypto = require("crypto");
var ensureFiles = require("./tasks/ensure-files.js");

var ts = $.typescript;
var tsProject = ts.createProject("tsconfig.json");

var AUTOPREFIXER_BROWSERS = [
	"ie >= 10",
	"ie_mob >= 10",
	"ff >= 30",
	"chrome >= 34",
	"safari >= 7",
	"opera >= 23",
	"ios >= 7",
	"android >= 4.4",
	"bb >= 10"
];

var DIST = "dist";

var dist = function (subpath) {
	return !subpath ? DIST : path.join(DIST, subpath);
};

var styleTask = function (stylesPath, srcs) {
	return gulp.src(srcs.map(function (src) {
		return path.join("app", stylesPath, src);
	}))
		.pipe($.changed(stylesPath, { extension: ".css" }))
		.pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
		.pipe(gulp.dest(".tmp/" + stylesPath))
		.pipe($.minifyCss())
		.pipe(gulp.dest(dist(stylesPath)))
		.pipe($.size({ title: stylesPath }));
};

var imageOptimizeTask = function (src, dest) {
	return gulp.src(src)
		.pipe($.imagemin({
			progressive: true,
			interlaced: true
		}))
		.pipe(gulp.dest(dest))
		.pipe($.size({ title: "images" }));
};

var optimizeHtmlTask = function (src, dest) {
	var assets = $.useref.assets({
		searchPath: [".tmp", "app"]
	});

	return gulp.src(src)
		.pipe(assets)
		// Concatenate and minify JavaScript
		.pipe($.if("*.js", $.uglify({
			preserveComments: "some"
		})))
		.on("error", function (uglifyErr) {
			process.stdout.write("uglify err", + JSON.stringify(uglifyErr));
		})
		// Concatenate and minify styles
		// In case you are still using useref build blocks
		.pipe($.if("*.css", $.minifyCss()))
		.pipe(assets.restore())
		.pipe($.useref())
		// Minify any HTML
		.pipe($.if("*.html", $.minifyHtml({
			quotes: true,
			empty: true,
			spare: true
		})))
		// Output files
		.pipe(gulp.dest(dest))
		.pipe($.size({
			title: "html"
		}));
};

// Compile and automatically prefix stylesheets
gulp.task("styles", function () {
	return styleTask("styles", ["**/*.css"]);
});

// Ensure that we are not missing required files for the project
// "dot" files are specifically tricky due to them being hidden on
// some systems.
gulp.task("ensureFiles", function (cb) {
	var requiredFiles = [".bowerrc"];

	ensureFiles(requiredFiles.map(function (p) {
		return path.join(__dirname, p);
	}), cb);
});

// Optimize images
gulp.task("images", function () {
	return imageOptimizeTask("app/images/**/*", dist("images"));
});

// Copy all files at the root level (app)
gulp.task("copy", function () {
	var app = gulp.src([
		"app/*",
		"!app/test",
		"!app/elements",
		"!app/bower_components",
		"!app/cache-config.json",
		"!**/.DS_Store"
	],
		{
			dot: true
		}).pipe(gulp.dest(dist()));

	// Copy over only the bower_components we need
	// These are things which cannot be vulcanized
	var bower = gulp.src([
		"app/bower_components/{webcomponentsjs,platinum-sw,sw-toolbox,promise-polyfill}/**/*"
	]).pipe(gulp.dest(dist("bower_components")));

	return merge(app, bower)
		.pipe($.size({
			title: "copy"
		}));
});

// Copy web fonts to dist
gulp.task("fonts", function () {
	return gulp.src(["app/fonts/**"])
		.pipe(gulp.dest(dist("fonts")))
		.pipe($.size({
			title: "fonts"
		}));
});

// Scan your HTML for assets & optimize them
gulp.task("html", function () {
	return optimizeHtmlTask(
		["app/**/*.html", "!app/{elements,test,bower_components}/**/*.html"],
		dist());
});

// Vulcanize granular configuration
gulp.task("vulcanize", function () {
	return gulp.src("app/elements/elements.html")
		.pipe($.vulcanize({
			stripComments: true,
			inlineCss: true,
			inlineScripts: true
		}))
		.pipe(gulp.dest(dist("elements")))
		.pipe($.size({ title: "vulcanize" }));
});

// Generate config data for the <sw-precache-cache> element.
// This include a list of files that should be precached, as well as a (hopefully unique) cache
// id that ensure that multiple PSK projects don"t share the same Cache Storage.
// This task does not run by default, but if you are interested in using service worker caching
// in your project, please enable it within the "default" task.
// See https://github.com/PolymerElements/polymer-starter-kit#enable-service-worker-support
// for more context.
gulp.task("cache-config", function (callback) {
	var dir = dist();
	var config = {
		cacheId: packageJson.name || path.basename(__dirname),
		disabled: false
	};

	glob([
		"index.html",
		"./",
		"bower_components/webcomponentsjs/webcomponents-lite.min.js",
		"{elements,scripts,styles}/**/*.*"],
		{ cwd: dir }, function (error, files) {
			if (error) {
				callback(error);
			} else {
				config.precache = files;

				var md5 = crypto.createHash("md5");
				md5.update(JSON.stringify(config.precache));
				config.precacheFingerprint = md5.digest("hex");

				var configPath = path.join(dir, "cache-config.json");
				fs.writeFile(configPath, JSON.stringify(config), callback);
			}
		});
});

// Clean output directory
gulp.task("clean", function () {
	return del([".tmp", dist()]);
});

gulp.task("server-typescript", ["lint"], function () {
	var sourcemaps = require("gulp-sourcemaps");
	var tsResult = tsProject.src({ base: "server" })
		.pipe(sourcemaps.init()) // This means sourcemaps will be generated 
		.pipe(ts(tsProject));

	return tsResult.js.pipe(sourcemaps.write())
		.pipe(gulp.dest(dist("server")));
});

gulp.task("polylint", function () {
	return gulp.src(["app/index.html"])
		.pipe($.polylint())
		.pipe($.polylint.reporter($.polylint.reporter.stylishlike))
		.pipe($.polylint.reporter.fail({ buffer: true, ignoreWarnings: false }));
});

gulp.task("lint", function () {
	var tslint = require("gulp-tslint");
	var stylish = require("tslint-stylish");
	try {
		return gulp.src("server/**/*.ts")
			.pipe(tslint({
				"extends": "tslint:recommended"
			}))
			.pipe(tslint.report(stylish, {
				sort: true,
				bell: true,
				fullPath: true,
				emitError: false
			}));
	}
	catch (err) {
		//  empty
	}
});

gulp.task("watch-typescript", ["server-typescript"], function () {
	gulp.watch(["server/**/*.ts"], ["server-typescript"]);
});

// Build production files, the default task
gulp.task("default", ["clean"], function (cb) {
	// Uncomment "cache-config" if you are going to use service workers.
	runSequence(
		["ensureFiles", "copy", "styles"],
		["images", "fonts", "html"],
		"vulcanize", // "cache-config",
		"server-typescript",
		cb);
});

// Load custom tasks from the `tasks` directory
try {
	require("require-dir")("tasks");
} catch (err) {
	// Do nothing
}
