/*eslint-env node */

var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var eslint = require('gulp-eslint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
const babel = require('gulp-babel');
var styleInject = require("gulp-style-inject");

gulp.task('default', ['styles', 'copy-html', 'copy-images', 'scripts'], function () {
	gulp.watch('styles/**/*.scss', ['styles']);
	gulp.watch('js/**/*.js', ['scripts']);
	gulp.watch('./*.html', ['copy-html']);
	gulp.watch('./dist/index.html').on('change', browserSync.reload);

	browserSync.init({
		server: './dist',
		https: {
			key: "./development_certificate/server.key",
			cert: "./development_certificate/server.crt"
		}
	});
});

gulp.task('dist', [
	'styles',
	'copy-images',
	'scripts-dist',
	'copy-html'
], function () {
	browserSync.init({
		server: './dist',
		https: {
			key: "./development_certificate/server.key",
			cert: "./development_certificate/server.crt"
		}
	});
});

gulp.task('scripts', function () {
	gulp.src(['sw.js'])
		.pipe(babel({
			presets: ['env']
		}))
		.pipe(gulp.dest('dist'));

	gulp.src(['js/dbhelper.js'])
		.pipe(babel({
			presets: ['env']
		}))
		.pipe(gulp.dest('dist/js'));

	gulp.src(['node_modules/idb/lib/idb.js'])
		.pipe(babel({
			presets: ['env']
		}))
		.pipe(gulp.dest('dist/js'));

	gulp.src(['js/*.min.js'])
		.pipe(gulp.dest('dist/js'));

	gulp.src(['js/list/*.js', 'js/pwa.js'])
		.pipe(concat('list.js'))
		.pipe(babel({
			presets: ['env'],
			ignore: '**/*.min.js'
		}))
		.pipe(gulp.dest('dist/js'));

	gulp.src(['js/*.js', 'node_modules/idb/lib/idb.js', 'js/detail/*.js'])
		.pipe(concat('detail.js'))
		.pipe(babel({
			presets: ['env']
		}))
		.pipe(gulp.dest('dist/js'));

	gulp.src(['manifest.json'])
		.pipe(gulp.dest('dist'));

	return gulp.src(['icons/'])
		.pipe(gulp.dest('dist/icons'));
});

gulp.task('scripts-dist', function () {

	gulp.src(['sw.js'])
		.pipe(babel({
			presets: ['env']
		}))
		.pipe(uglify())
		.pipe(gulp.dest('dist'));

	gulp.src(['js/dbhelper.js'])
		.pipe(babel({
			presets: ['env']
		}))
		.pipe(uglify())
		.pipe(gulp.dest('dist/js'));

	gulp.src(['node_modules/idb/lib/idb.js'])
		.pipe(babel({
			presets: ['env']
		}))
		.pipe(uglify())
		.pipe(gulp.dest('dist/js'));

	gulp.src(['js/*.min.js'])
		.pipe(uglify())
		.pipe(gulp.dest('dist/js'));

	gulp.src(['js/list/*.js', 'js/pwa.js'])
		.pipe(concat('list.js'))
		.pipe(babel({
			presets: ['env'],
			ignore: '**/*.min.js'
		}))
		.pipe(uglify())
		.pipe(gulp.dest('dist/js'));

	gulp.src(['js/*.js', 'node_modules/idb/lib/idb.js', 'js/detail/*.js'])
		.pipe(babel({
			presets: ['env'],
			ignore: '**/*.min.js'
		}))
		.pipe(uglify())
		.pipe(concat('detail.js'))
		.pipe(gulp.dest('dist/js'));

	return gulp.src(['manifest.json'])
		.pipe(gulp.dest('dist'));
});

gulp.task('copy-html', ['styles'], function () {
	return gulp.src(['index.html', 'restaurant.html'])
		.pipe(styleInject())
		.pipe(gulp.dest('./dist'));
});

gulp.task('copy-images', function () {
	 gulp.src('img/*')
		.pipe(gulp.dest('dist/img'));

	return gulp.src(['icons/*'])
		.pipe(gulp.dest('dist/icons'));
});

gulp.task('styles', function () {
	return gulp.src('styles/**/*.scss')
		.pipe(sass({
			outputStyle: 'compressed'
		}).on('error', sass.logError))
		.pipe(autoprefixer({
			browsers: ['last 2 versions']
		}))
		.pipe(gulp.dest('dist/css'))
		.pipe(browserSync.stream());
});