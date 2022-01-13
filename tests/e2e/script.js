/**
 * This file was originally copied from the @wordpress/scripts package, version 12.0.0:
 * https://github.com/WordPress/gutenberg/blob/8e06f0d212f89adba9099106497117819adefc5a/packages/scripts/scripts/test-e2e.js
 *
 * Author: The WordPress Contributors.
 * Licence: GPL-2.0-or-later.
 */

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'test';
process.env.NODE_ENV = 'test';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on( 'unhandledRejection', ( err ) => {
	throw err;
} );

/**
 * External dependencies
 */
/* eslint-disable-next-line jest/no-jest-import */
const jest = require( 'jest' );
const { sync: spawn } = require( 'cross-spawn' );
const { existsSync, realpathSync } = require( 'fs' );
const path = require( 'path' );
const { sync: readPkgUp } = require( 'read-pkg-up' );

// getArgsFromCLI inlined from @wordpress/scripts utils/process.js v12.0.0.
// https://github.com/WordPress/gutenberg/blob/8e06f0d212f89adba9099106497117819adefc5a/packages/scripts/utils/process.js#L1-L11

const getArgsFromCLI = ( excludePrefixes ) => {
	const args = process.argv.slice( 2 );
	if ( excludePrefixes ) {
		return args.filter( ( arg ) => {
			return ! excludePrefixes.some( ( prefix ) =>
				arg.startsWith( prefix )
			);
		} );
	}
	return args;
};

const getCurrentWorkingDirectory = process.cwd;

// getPackagePath and hasPackageProp inlined from @wordpress/scripts utils/package.js v12.0.0.
// https://github.com/WordPress/gutenberg/blob/8e06f0d212f89adba9099106497117819adefc5a/packages/scripts/utils/package.js#L12-L18

const { pkg, path: pkgPath } = readPkgUp( {
	cwd: realpathSync( getCurrentWorkingDirectory() ),
} );

const getPackagePath = () => pkgPath;

const hasPackageProp = ( prop ) => pkg && pkg.hasOwnProperty( prop );

// fromProjectRoot, hasProjectFile and fromConfigRoot inlined from @wordpress/scripts utils/file.js v12.0.0.
// https://github.com/WordPress/gutenberg/blob/8e06f0d212f89adba9099106497117819adefc5a/packages/scripts/utils/file.js#L12-L19

const fromProjectRoot = ( fileName ) =>
	path.join( path.dirname( getPackagePath() ), fileName );

const hasProjectFile = ( fileName ) =>
	existsSync( fromProjectRoot( fileName ) );

const fromConfigRoot = ( fileName ) =>
	path.join( path.dirname( __dirname ), 'config', fileName );

// getArgFromCLI and hasArgInCLI inlined from @wordpress/scripts utils/cli.js v12.0.0.
// https://github.com/WordPress/gutenberg/blob/8e06f0d212f89adba9099106497117819adefc5a/packages/scripts/utils/cli.js#L13-L22

const getArgFromCLI = ( arg ) => {
	for ( const cliArg of getArgsFromCLI() ) {
		const [ name, value ] = cliArg.split( '=' );
		if ( name === arg ) {
			return value || null;
		}
	}
};

// getJestOverrideConfigFile and hasJestConfig inlined from @wordpress/scripts utils/config.js v12.0.0.
// https://github.com/WordPress/gutenberg/blob/8e06f0d212f89adba9099106497117819adefc5a/packages/scripts/utils/config.js#L41-L58

function getJestOverrideConfigFile( suffix ) {
	if ( hasArgInCLI( '-c' ) || hasArgInCLI( '--config' ) ) {
		return;
	}

	if ( hasProjectFile( `jest-${ suffix }.config.js` ) ) {
		return fromProjectRoot( `jest-${ suffix }.config.js` );
	}

	if ( ! hasJestConfig() ) {
		return fromConfigRoot( `jest-${ suffix }.config.js` );
	}
}

const hasJestConfig = () =>
	hasProjectFile( 'jest.config.js' ) ||
	hasProjectFile( 'jest.config.json' ) ||
	hasPackageProp( 'jest' );

const hasArgInCLI = ( arg ) => getArgFromCLI( arg ) !== undefined;

const result = spawn( 'node', [ require.resolve( 'puppeteer/install' ) ], {
	stdio: 'inherit',
} );

if ( result.status > 0 ) {
	process.exit( result.status );
}

// Provides a default config path for Puppeteer when jest-puppeteer.config.js
// wasn't found at the root of the project or a custom path wasn't defined
// using JEST_PUPPETEER_CONFIG environment variable.
if (
	! hasProjectFile( 'jest-puppeteer.config.js' ) &&
	! process.env.JEST_PUPPETEER_CONFIG
) {
	process.env.JEST_PUPPETEER_CONFIG = fromConfigRoot( 'puppeteer.config.js' );
}

const configFile = getJestOverrideConfigFile( 'e2e' );

const config = configFile
	? [ '--config', JSON.stringify( require( configFile ) ) ]
	: [];

const hasRunInBand = hasArgInCLI( '--runInBand' ) || hasArgInCLI( '-i' );
const runInBand = ! hasRunInBand ? [ '--runInBand' ] : [];

if ( hasArgInCLI( '--puppeteer-interactive' ) ) {
	process.env.PUPPETEER_HEADLESS = 'false';
	process.env.PUPPETEER_SLOWMO = getArgFromCLI( '--puppeteer-slowmo' ) || 80;
}

if ( hasArgInCLI( '--puppeteer-devtools' ) ) {
	process.env.PUPPETEER_HEADLESS = 'false';
	process.env.PUPPETEER_DEVTOOLS = 'true';
}

const configsMapping = {
	WP_BASE_URL: '--wordpress-base-url',
	WP_USERNAME: '--wordpress-username',
	WP_PASSWORD: '--wordpress-password',
};

Object.entries( configsMapping ).forEach( ( [ envKey, argName ] ) => {
	if ( hasArgInCLI( argName ) ) {
		process.env[ envKey ] = getArgFromCLI( argName );
	}
} );

const cleanUpPrefixes = [ '--puppeteer-', '--wordpress-' ];

jest.run( [ ...config, ...runInBand, ...getArgsFromCLI( cleanUpPrefixes ) ] );
