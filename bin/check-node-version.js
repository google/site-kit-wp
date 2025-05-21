#!/usr/bin/env node
/* eslint-disable no-console */

const { execSync } = require( 'child_process' );
const fs = require( 'fs' );
const path = require( 'path' );

const getMajorVersion = ( version ) => {
	const majorVersion = version.split( '.' )[ 0 ];

	if ( majorVersion === undefined ) {
		throw new Error( `Unable to parse version: ${version}` );
	}

	return parseInt( majorVersion, 10 );
}

const currentNodeVersion = process.versions.node;
const currentMajorNodeVersion = getMajorVersion( currentNodeVersion );

const nvmrcPath = path.join( __dirname, '../.nvmrc' );
const expectedNodeVersion = fs.readFileSync( nvmrcPath, 'utf8' ).trim();
const expectedMajorNodeVersion = getMajorVersion( expectedNodeVersion );

const currentNPMVersion = execSync( 'npm -v' ).toString().trim();
const currentMajorNPMVersion = getMajorVersion( currentNPMVersion );

const packageFile = require( '../package.json' );
const expectedNPMVersion = packageFile.scripts[ 'install-global-npm' ].split( '@' )[ 1 ];
const expectedMajorNPMVersion = getMajorVersion( expectedNPMVersion );

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
