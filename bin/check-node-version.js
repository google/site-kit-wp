#!/usr/bin/env node
/* eslint-disable no-console */

const { execSync } = require( 'child_process' );
const fs = require( 'fs' );
const path = require( 'path' );

const currentNodeVersion = process.versions.node;
const currentMajorNodeVersion = parseInt( currentNodeVersion.split( '.' )[ 0 ] );

const nvmrcPath = path.join( __dirname, '../.nvmrc' );
const expectedNodeVersion = fs.readFileSync( nvmrcPath, 'utf8' ).trim();
const expectedMajorNodeVersion = parseInt( expectedNodeVersion.split( '.' )[ 0 ] );

const currentNPMVersion = execSync( 'npm -v' ).toString().trim();
const currentMajorNPMVersion = parseInt( currentNPMVersion.split( '.' )[ 0 ] );

const packageFile = require( '../package.json' );
const expectedNPMVersion = packageFile.scripts[ 'install-global-npm' ].split( '@' )[ 1 ];
const expectedMajorNPMVersion = parseInt( expectedNPMVersion.split( '.' )[ 0 ] );

if ( currentMajorNodeVersion !== expectedMajorNodeVersion ) {
	console.error(
		`Incorrect Node.js version. Expected v${expectedMajorNodeVersion}, but found ${currentNodeVersion}. Please run nvm use.`
	);

	process.exit( 1 );
}

if ( currentMajorNPMVersion !== expectedMajorNPMVersion ) {
	console.error(
		`Incorrect NPM version. Expected v${expectedMajorNPMVersion}, but found ${currentNPMVersion}. Please run npm run install-global-npm.`
	);

	process.exit( 1 );
}
