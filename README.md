# grunt-aws-setup

> Prepare an AWS environment.

## Getting Started
This plugin requires Grunt `~0.4.2`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to
check out the [Getting Started](http://gruntjs.com/getting-started)
guide, as it explains how to create a
[Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install
and use Grunt plugins. Once you're familiar with that process, you may
install this plugin with this command:

```shell
npm install grunt-aws-setup --save-dev
```

Once the plugin has been installed, it may be enabled inside your
Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-aws-setup');
```

## The "aws_cloudformation" task

### Overview
The `aws_cloudformation` task runs a CloudFormation template in either
create or update mode, depending on whether or not it already exists.

Note that this Grunt task uses the AWS SDK for Node.js and expects
configuration to be supplied externally. For example, you could run
this task on an EC2 instance with an IAM role, or you could use
environment variables to configure the credentials.

In your project's Gruntfile, add a section named `aws_cloudformation`
to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  aws_cloudformation: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
});
```

### Options

#### options.stackName
Type: `String`

The name of the CloudFormation stack to create or update.

#### options.definitionFile
Type: `String`

The filename of the stack definition JSON file.

#### options.configVariable
Type: `String`
Default value: The name of the Grunt target (`this.nameArgs`).

The name of the Grunt configuration variable that will hold any stack
output values.

#### options.region
Type: `String`

The region in which to run the stack.

#### options.capabilities
Type: `String`

The list of capabilities required by the stack.

#### options.parameters
Type: `Object`

Parameters to pass to the stack. This should be a single object whose
keys are the parameters keys and whose values are the parameters values.

### Usage Examples

#### Without Parameters
In this example, a CloudFormation stack template contained in the
`definitions/cloudformation/vpc.json` file is used to create a
CloudFormation stack named `VPCStack` in the `us-west-2` region.

```js
grunt.initConfig({
  aws_cloudformation: {
    vpc: {
      options: {
        region: 'us-west-2',
        stackName: 'VPCStack,
        definitionFile: 'definitions/cloudformation/vpc.json'
      }
    }
  }
});
```

#### With Parameters
In this example, parameters contained in the Grunt configuration
object are used to pass parameters to a stack. The paramters could be
produced by other CloudFormation runs or by any other method.

```js
grunt.initConfig({
  aws_cloudformation: {
    elb: {
      options: {
        region: 'us-west-2',
        stackName: 'ELBStack,
        definitionFile: 'definitions/cloudformation/elb.json',
        params: {
          VpcId: '<%= grunt.config("aws_cloudformation:vpc.VpcId") %>',
          VpcSubnets: '<%= grunt.config("aws_cloudformation:vpc.VpcSubnets") %>'
        }
      }
    }
  }
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_
