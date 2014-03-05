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

  grunt.registerMultiTask('aws_cloudformation', 'Execute a CloudFormation stack.', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      region: 'us-west-1',
      configVariable: this.nameArgs
    });

    // check for required options
    if (!options.stackName) {
      grunt.log.error('stackName must be defined.');
      return;
    }

    if (!options.definitionFile) {
      grunt.log.error('definitionFile must be defined.');
      return;
    }

    if (!grunt.file.isFile(options.definitionFile)) {
      grunt.log.error('Cloud not find definitionFile.');
      return;
    }

    var done = this.async();
    var cf = new AWS.CloudFormation({ region: options.region });
    var noUpdateFlag = false;

    async.waterfall([
      // check to see if the stack exists and create or update it
      _.bind(cf.describeStacks, cf, { }),
      function (data, callback) {
        var stack = _.findWhere(data.Stacks, { StackName: options.stackName });
        var params = {
          StackName: options.stackName,
          TemplateBody: grunt.file.read(options.definitionFile)
        };
        if (options.capabilities) {
          params.Capabilities = options.capabilities;
        }
        if (options.params) {
          params.Parameters = _.chain(options.params)
            .pairs()
            .map(function (val) {
              return {
                ParameterKey: val[0],
                ParameterValue: val[1]
              };
            })
            .value();
        }
        if (stack) {
          grunt.log.writeln('Updating CloudFormation stack: ' + options.stackName);
          cf.updateStack(params, function (err, data) {
            // ignore errors about no updates
            if (err && err.message === 'No updates are to be performed.') {
              grunt.log.writeln('No updates required, retrieving current outputs.');
              callback(null, 'NO_UPDATES');
              return;
            }
            callback(err, data);
          });
        } else {
          grunt.log.writeln('Creating CloudFormation stack: ' + options.stackName);
          cf.createStack(params, callback);
        }
      },
      // wait until it is complete
      function (data, callback) {
        noUpdateFlag = (data === 'NO_UPDATES');
        var status, reason, outputs;
        grunt.log.write('Waiting ');
        async.doUntil(function (callback) {
          grunt.log.write('.');
          cf.describeStacks({ StackName: options.stackName }, function (err, data) {
            if (err) {
              callback(err);
              return;
            }
            status = data.Stacks[0].StackStatus;
            reason = data.Stacks[0].StackStatusReason;
            outputs = data.Stacks[0].Outputs;
            
            setTimeout(callback, noUpdateFlag ? 1 : 5000);
          });
        }, function () {
          return _.endsWith(status, 'COMPLETE') || _.endsWith(status, 'FAILED');
        }, function (err) {
          grunt.log.writeln();
          callback(err, status, reason, outputs);
        });
      }
    ], function (err, status, reason, outputs) {
      if (err) {
        grunt.log.error('An error occurred: ' + JSON.stringify(err, null, 2));
        done(false);
        return;
      }
      // if no updates were made, ignore the status
      if (noUpdateFlag) {
        status = 'NO_UPDATE';
      }
      switch (status) {
        case 'CREATE_FAILED':
        case 'UPDATE_ROLLBACK_FAILED':
        case 'UPDATE_ROLLBACK_COMPLETE':
        case 'ROLLBACK_COMPLETE':
          grunt.log.error('CloudFormation Failed.');
          grunt.log.error('Status: ' + status);
          if (reason) {
            grunt.log.error('Reason: ' + reason);
          }
          done(false);
          break;
        default:
          grunt.log.writeln('CloudFormation Complete.');
          grunt.log.writeln('Status: ' + status);
          if (reason) {
            grunt.log.writeln('Reason: ' + reason);
          }
          var configOutput = {};
          _.each(outputs, function (output) {
            configOutput[output.OutputKey] = output.OutputValue;
          });
          grunt.config.set(options.configVariable, configOutput);
          done();
        }
    });
  });
};
