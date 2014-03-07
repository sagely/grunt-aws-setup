/*
 * grunt-aws-setup
 * https://github.com/TeamPraxis/grunt-aws-setup
 *
 * Copyright (c) 2014 Keith Hamasaki
 * Licensed under the MIT license.
 */

/*jshint node: true */
'use strict';

var AWS = require('aws-sdk'),
    async = require('async'),
    _ = require('lodash');

_.str = require('underscore.string');
_.mixin(_.str.exports());

module.exports = function(grunt) {

  grunt.registerMultiTask('aws_s3_cors', 'Apply a CORS configuration file to an S3 bucket.', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      region: 'us-west-1',
      configVariable: this.nameArgs
    });

    // check for required options
    if (!options.bucketName) {
      grunt.log.error('bucketName must be defined.');
      return;
    }

    if (!options.corsConfiguration) {
      grunt.log.error('corsConfiguration must be defined.');
      return;
    }

    var done = this.async();
    var s3 = new AWS.S3({ region: options.region });

    s3.putBucketCors({
      Bucket: options.bucketName,
      CORSConfiguration: options.corsConfiguration
    }, function (err, data) {
      if (err) {
        grunt.log.error('An error occurred: ' + JSON.stringify(err, null, 2));
        done(false);
        return;
      }
      done();      
    });
  });
};
