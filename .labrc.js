// default settings for lab test runs.
//
// This is overridden if arguments are passed to lab via the command line.
module.exports = {
  // This version global seems to be introduced by sinon.
  globals: 'version',
  verbose: true,
  'coverage-exclude': [
    'src/lib/logger/vendor',
    'scripts',
    'node_modules',
    'migrations',
    'test'
  ]
};
