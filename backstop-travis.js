const scenarios = require( './tests/backstop/scenarios-travis' );

const backstopOptions = require( './tests/backstop/backstop-options' );

module.exports = backstopOptions( scenarios );