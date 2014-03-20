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

  grunt.registerMultiTask('aws_ssl', 'Create an AWS SSL Key.', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      region: 'us-west-1',
      configVariable: this.nameArgs
    });

    var iam;
    var done;

    // check for required options
    if (!options.certificateName) {
      grunt.log.error('certificateName must be defined.');
      return;
    }

    if (options['delete'] && options['delete'] === true) {
      done = this.async();
      async.waterfall([
        // Check if this should be run on another account
        function (callback) {
          if (!options.assumeRole) {
            iam = new AWS.IAM();
            grunt.verbose.writeln('No assumeRole provided');
            callback();
            return;
          }
          grunt.log.writeln('Assuming roll: ' + options.assumeRole);
          var sts = new AWS.STS();
          sts.assumeRole({
            RoleArn: options.assumeRole,
            RoleSessionName:'GruntSession'
          }, function (err, data) {
            if (err) {
              callback(err);
              return;
            }
            iam = new AWS.IAM({
              region: options.region,
              accessKeyId: data.Credentials.AccessKeyId,
              secretAccessKey: data.Credentials.SecretAccessKey,
              sessionToken: data.Credentials.SessionToken
            });
            callback();
          });
        },
        function (callback) {
          iam.deleteServerCertificate({ ServerCertificateName: options.certificateName }, callback);
        }
      ], function (err, data) {
        if (err) {
          grunt.log.error('An error occurred: ' + JSON.stringify(err, null, 2));
          done(false);
          return;
        }
        grunt.log.writeln('Removed certificate');
        done();
      });
      return;
    }

    if (!options.certificateBodyFile) {
      grunt.log.error('certificateBodyFile must be defined.');
      return;
    }

    if (!options.privateKeyFile) {
      grunt.log.error('privateKeyFile must be defined.');
      return;
    }

    if (!grunt.file.isFile(options.certificateBodyFile)) {
      grunt.log.error('Could not find certificateBodyFile.');
      return;
    }

    if (!grunt.file.isFile(options.privateKeyFile)) {
      grunt.log.error('Could not find privateKeyFile.');
      return;
    }

    if (options.certificateChainFile && !grunt.file.isFile(options.certificateChainFile)) {
      grunt.log.error('Could not find certificateChainFile.');
      return;
    }

    done = this.async();
    async.waterfall([
      // Check if this should be run on another account
      function (callback) {
        if (!options.assumeRole) {
          iam = new AWS.IAM();
          grunt.verbose.writeln('No assumeRole provided');
          callback();
          return;
        }
        grunt.log.writeln('Assuming roll: ' + options.assumeRole);
        var sts = new AWS.STS();
        sts.assumeRole({
          RoleArn: options.assumeRole,
          RoleSessionName:'GruntSession'
        }, function (err, data) {
          if (err) {
            callback(err);
            return;
          }
          iam = new AWS.IAM({
            region: options.region,
            accessKeyId: data.Credentials.AccessKeyId,
            secretAccessKey: data.Credentials.SecretAccessKey,
            sessionToken: data.Credentials.SessionToken
          });
          callback();
        });
      },

      // check if it already exists
      function (callback) {
        iam.listServerCertificates(callback);
      },
      function (data, callback) {
        var cert = _.findWhere(data.ServerCertificateMetadataList, { ServerCertificateName: options.certificateName });
        if (cert) {
          grunt.log.writeln('Certificate already exists, skipping');
          callback(null, cert);
        } else {
          grunt.log.writeln('Creating certificate');
          var parms = {
            ServerCertificateName: options.certificateName,
            CertificateBody: grunt.file.read(options.certificateBodyFile),
            PrivateKey: grunt.file.read(options.privateKeyFile)
          };
          if (options.certificateChainFile) {
            parms.CertificateChain = grunt.file.read(options.certificateChainFile);
          }
          if (options.path) {
            parms.Path = options.path;
          }
          iam.uploadServerCertificate(parms, function (err, data) {
            if (err) {
              callback(err);
              return;
            }
            callback(null, data.ServerCertificateMetadata);
          });
        }
      }
    ], function (err, data) {
      if (err) {
        grunt.log.error('An error occurred: ' + JSON.stringify(err, null, 2));
        done(false);
        return;
      }

      grunt.config.set(options.configVariable, data.Arn);
      done();
    });
  });
};
