"use strict";
module.exports = function(grunt) {

  //Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: ['client/build', 'server/static'],
    copy: {
      build: {
        files: [{expand: true, cwd: 'client/build', src:'**/*', dest: 'server/static'}]
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
          cwd: 'client/src/',
          src: ['**/*.html'],
          dest: 'client/build',
          ext: '.html'
        }]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');

  grunt.registerTask('default', [
    'clean',
    'htmlmin:build',
    'copy:build'
  ]);
};
