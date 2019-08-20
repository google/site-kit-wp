const scenariosData = require( '../../tests/backstop/scenarios-data' );

const rootURL = 'http://172.17.0.1:9001/iframe.html?id=';

const scenarios = scenariosData( rootURL );

module.exports = scenarios;
