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
	gulp.watch('sass/**/*.scss', ['styles']);
	gulp.watch('js/**/*.js', ['scripts']);
	gulp.watch('./*.html', ['copy-html']);
	gulp.watch('./dist/index.html').on('change', browserSync.reload);

	browserSync.init({
		server: './dist'
	});
});

gulp.task('dist', [
	'copy-html',
	'copy-images',
	'styles',
	'scripts-dist'
], function () {
	browserSync.init({
		server: './dist'
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

	gulp.src(['js/list/*.js'])
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
});

gulp.task('scripts-dist', function () {

	gulp.src(['sw.js'])
		.pipe(babel({
			presets: ['env']
		}))
		.pipe(uglify())
		.pipe(gulp.dest('dist'));

	gulp.src(['js/*.min.js'])
		.pipe(uglify())
		.pipe(gulp.dest('dist/js'));

	gulp.src(['js/*.js', '!js/*.min.js', 'node_modules/idb/lib/idb.js', 'js/list/*.js'])
		.pipe(babel({
			presets: ['env']
		}))
		.pipe(uglify())
		.pipe(concat('list.js'))
		.pipe(gulp.dest('dist/js'));

	gulp.src(['js/*.js', 'node_modules/idb/lib/idb.js', 'js/detail/*.js'])
		.pipe(babel({
			presets: ['env']
		}))
		.pipe(uglify())
		.pipe(concat('detail.js'))
		.pipe(gulp.dest('dist/js'));
});

gulp.task('copy-html', function () {
	gulp.src('./*.html')
		.pipe(styleInject())
		.pipe(gulp.dest('./dist'));
});

gulp.task('copy-images', function () {
	gulp.src('img/*')
		.pipe(gulp.dest('dist/img'));
});

gulp.task('styles', function () {
	gulp.src('styles/**/*.scss')
		.pipe(sass({
			outputStyle: 'compressed'
		}).on('error', sass.logError))
		.pipe(autoprefixer({
			browsers: ['last 2 versions']
		}))
		.pipe(gulp.dest('dist/css'))
		.pipe(browserSync.stream());
});