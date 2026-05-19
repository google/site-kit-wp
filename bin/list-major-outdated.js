#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require( 'fs' );
const path = require( 'path' );

const PROJECT_ROOT = path.join( __dirname, '..' );
const DEFAULT_INPUT = path.join( PROJECT_ROOT, 'npm-outdated.out' );

const PACKAGE_JSON_FILES = [
	'package.json',
	'assets/package.json',
	'storybook/package.json',
	'tests/backstop/package.json',
	'tests/e2e/package.json',
	'tests/js/package.json',
	'tests/playwright/package.json',
];

const DEPENDENCY_FIELDS = [
	'dependencies',
	'devDependencies',
	'peerDependencies',
	'optionalDependencies',
];

const LINE_PATTERN =
	/^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(node_modules\S+)\s+(.+)$/;

function getMajorVersion( version ) {
	const majorVersion = version.split( '.' )[ 0 ];
	if ( majorVersion === undefined || ! /^\d+$/.test( majorVersion ) ) {
		return null;
	}

	return parseInt( majorVersion, 10 );
}

function parseOutdatedLine( line ) {
	const match = line.match( LINE_PATTERN );
	if ( ! match ) {
		return null;
	}

	const [ , pkg, current, , latest ] = match;
	const currentMajor = getMajorVersion( current );
	const latestMajor = getMajorVersion( latest );

	if ( currentMajor === null || latestMajor === null ) {
		return null;
	}

	if ( latestMajor <= currentMajor ) {
		return null;
	}

	return {
		package: pkg,
		current,
		latest,
		currentMajor,
		latestMajor,
	};
}

function parseOutdatedFile( filePath ) {
	const contents = fs.readFileSync( filePath, 'utf8' );
	const seen = new Map();

	for ( const line of contents.split( '\n' ) ) {
		if ( ! line.trim() || line.startsWith( 'Package' ) ) {
			continue;
		}

		const entry = parseOutdatedLine( line );
		if ( ! entry ) {
			continue;
		}

		const key = `${ entry.package }\t${ entry.current }\t${ entry.latest }`;
		if ( ! seen.has( key ) ) {
			seen.set( key, entry );
		}
	}

	return [ ...seen.values() ];
}

function loadExplicitDependencies( packageJsonFiles ) {
	const dependencies = new Map();

	for ( const relativePath of packageJsonFiles ) {
		const packageJsonPath = path.join( PROJECT_ROOT, relativePath );

		if ( ! fs.existsSync( packageJsonPath ) ) {
			console.error( `File not found: ${ packageJsonPath }` );
			process.exit( 1 );
		}

		const packageJson = JSON.parse( fs.readFileSync( packageJsonPath, 'utf8' ) );

		for ( const field of DEPENDENCY_FIELDS ) {
			const fieldDependencies = packageJson[ field ];
			if ( ! fieldDependencies ) {
				continue;
			}

			for ( const dependency of Object.keys( fieldDependencies ) ) {
				if ( ! dependencies.has( dependency ) ) {
					dependencies.set( dependency, [] );
				}

				const packageJsonPaths = dependencies.get( dependency );
				if ( ! packageJsonPaths.includes( relativePath ) ) {
					packageJsonPaths.push( relativePath );
				}
			}
		}
	}

	return dependencies;
}

function filterExplicitDependencies( entries, explicitDependencies ) {
	return entries
		.filter( ( entry ) => explicitDependencies.has( entry.package ) )
		.map( ( entry ) => ( {
			...entry,
			listedIn: explicitDependencies.get( entry.package ),
		} ) )
		.sort( ( a, b ) => {
			const byPackage = a.package.localeCompare( b.package );
			if ( byPackage !== 0 ) {
				return byPackage;
			}

			return a.current.localeCompare( b.current );
		} );
}

function printEntries( entries ) {
	if ( entries.length === 0 ) {
		console.log( 'No packages with a newer major version found.' );
		return;
	}

	const packageWidth = Math.max(
		'Package'.length,
		...entries.map( ( entry ) => entry.package.length )
	);
	const versionWidth = Math.max(
		'Current'.length,
		'Latest'.length,
		...entries.flatMap( ( entry ) => [ entry.current.length, entry.latest.length ] )
	);
	const listedInWidth = Math.max(
		'Listed in'.length,
		...entries.map( ( entry ) => entry.listedIn.join( ', ' ).length )
	);

	console.log(
		`${ 'Package'.padEnd( packageWidth ) }  ${ 'Current'.padEnd( versionWidth ) }  ${ 'Latest'.padEnd( versionWidth ) }  ${ 'Major'.padEnd( 7 ) }  ${ 'Listed in'.padEnd( listedInWidth ) }`
	);

	for ( const entry of entries ) {
		const listedIn = entry.listedIn.join( ', ' );

		console.log(
			`${ entry.package.padEnd( packageWidth ) }  ${ entry.current.padEnd( versionWidth ) }  ${ entry.latest.padEnd( versionWidth ) }  ${ `${ entry.currentMajor } -> ${ entry.latestMajor }`.padEnd( 7 ) }  ${ listedIn.padEnd( listedInWidth ) }`
		);
	}

	console.log( `\n${ entries.length } package(s) with a newer major version.` );
}

function main() {
	const inputPath = path.resolve( process.argv[ 2 ] || DEFAULT_INPUT );

	if ( ! fs.existsSync( inputPath ) ) {
		console.error( `File not found: ${ inputPath }` );
		process.exit( 1 );
	}

	const explicitDependencies = loadExplicitDependencies( PACKAGE_JSON_FILES );
	const entries = filterExplicitDependencies(
		parseOutdatedFile( inputPath ),
		explicitDependencies
	);

	printEntries( entries );
}

main();
