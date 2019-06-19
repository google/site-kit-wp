const scenariosData = require( '../../tests/backstop/scenarios-data' );

const rootURL = 'http://host.docker.internal:9001/iframe.html?id=';

const scenarios = scenariosData( rootURL );

module.exports = scenarios;
