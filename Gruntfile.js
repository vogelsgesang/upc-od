"use strict";
module.exports = function(grunt) {

  //Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: ['client/build', 'server/static'],
    copy: {
      build: {
        files: [
          {expand: true, cwd: 'client', src:'js/**', dest: 'client/build'},
          {expand: true, cwd: 'client', src:'fonts/**', dest: 'client/build'}
        ]
      },
      deploy: {
        files: [
          {expand: true, cwd: 'client/build', src:'**/*', dest: 'server/static'}
        ]
      }
    },
    htmlmin: {
      build: {
        options: {
          removeComments: true,
          collapseWhitespace: true
        },
        files: [{
          expand: true,
          cwd: 'client/',
          src: ['main.html', 'partials/**/*.html'],
          dest: 'client/build',
          ext: '.html'
        }]
      }
    },
    less: {
      build: {
        options: {
          cleancss: true
        },
        files: {
          'client/build/style.css': 'client/less/style.less'
        }
      }
    },
    compress: {
      deploy: {
        options: {
          mode: 'gzip'
        },
        files: [
          {expand: true, cwd: 'server/static/', src: '**/*.html', dest: 'server/static/'},
          {expand: true, cwd: 'server/static/', src: '**/*.css', dest: 'server/static/'},
          {expand: true, cwd: 'server/static/', src: '**/*.js', dest: 'server/static/'},
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-less');

  grunt.registerTask('default', [
    'clean',
    'less',
    'htmlmin:build',
    'copy:build',
    'copy:deploy',
    'compress:deploy'
  ]);
};
