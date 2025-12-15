#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require( 'fs' );
const path = require( 'path' );

function getMajorVersion( version ) {
	const majorVersion = version.split( '.' )[ 0 ];
	if ( majorVersion === undefined ) {
		throw new Error( `Unable to parse version: ${version}` );
	}

	return parseInt( majorVersion, 10 );
}

const currentNodeVersion = process.versions.node;
const currentMajorNodeVersion = getMajorVersion( currentNodeVersion );

const nvmrcPath = path.join( __dirname, '../.nvmrc' );
const expectedMajorNodeVersion = getMajorVersion( fs.readFileSync( nvmrcPath, 'utf8' ).trim() );

if ( currentMajorNodeVersion !== expectedMajorNodeVersion ) {
	console.error(
		`Incorrect Node.js version. Expected ${expectedMajorNodeVersion}, but found ${currentNodeVersion}. Please run the "nvm use" command.`
	);

	process.exit( 1 );
}
