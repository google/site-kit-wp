#!/usr/bin/env node
'use strict';

const fs = require( 'fs' );
const path = require( 'path' );

function ensureDir( dirPath ) {
	fs.mkdirSync( dirPath, { recursive: true } );
}

/**
 * Extracts embedded base64 images to external PNG files.
 *
 * Input:  ![alt text][label]  (body)
 *         [label]: <data:image/TYPE;base64,DATA>  (definitions)
 * Output: ![alt text](<inputBase>/label.png)  +  <inputBase>/ folder containing
 *         the PNG files (named after the input file to avoid collisions when
 *         extracting multiple files into the same directory).
 */
function extractImages( inputPath ) {
	const inputDir = path.dirname( inputPath );
	const inputBase = path.basename( inputPath, '.md' );
	const imagesDir = path.join( inputDir, inputBase );
	const outputPath = path.join( inputDir, `${ inputBase }-extracted.md` );

	const src = fs.readFileSync( inputPath, 'utf8' );

	// Matches: [label]: <data:image/TYPE;base64,DATA>
	// The angle brackets are the standard markdown URL-wrapping syntax.
	const DEF_RE = /^\[([^\]]+)\]:\s*<data:image\/([^;>]+);base64,([^>]+)>/gm;

	// Matches reference-style image usage in the body: ![alt text][label]
	const REF_USAGE_RE = /!\[([^\]]*)\]\[([^\]]+)\]/g;

	let count = 0;
	const errors = [];
	const labelToPath = new Map();
	const definitionsToRemove = [];

	for ( const match of src.matchAll( DEF_RE ) ) {
		const [ fullMatch, label, subtype, b64 ] = match;
		const ext = subtype.toLowerCase() === 'jpeg' ? 'jpg' : subtype.toLowerCase();
		const filename = `${ label }.${ ext }`;
		const outPath = path.join( imagesDir, filename );
		const relativePath = `${ inputBase }/${ filename }`;

		try {
			const buffer = Buffer.from( b64.replace( /\s/g, '' ), 'base64' );
			labelToPath.set( label, relativePath );
			definitionsToRemove.push( fullMatch );
			ensureDir( imagesDir );
			fs.writeFileSync( outPath, buffer );
			console.log( `  [${ label }] → ${ relativePath }` );
			count++;
		} catch ( err ) {
			errors.push( err.message );
			console.error( `  Error writing ${ filename }: ${ err.message }` );
		}
	}

	if ( count === 0 && errors.length === 0 ) {
		console.error(
			'No embedded base64 images found. Expected format: [label]: <data:image/TYPE;base64,...>'
		);
		process.exit( 1 );
	}

	let output = src;

	for ( const definition of definitionsToRemove ) {
		output = output.replace( definition, '' );
	}

	output = output.replace( REF_USAGE_RE, ( fullMatch, alt, label ) => {
		const imgPath = labelToPath.get( label );
		return imgPath ? `![${ alt }](${ imgPath })` : fullMatch;
	} );

	output = output.replace( /\n{3,}/g, '\n\n' ).trimEnd() + '\n';

	fs.writeFileSync( outputPath, output, 'utf8' );
	console.log( `\nDone. ${ count - errors.length }/${ count } images extracted.` );
	console.log( `Output: ${ outputPath }` );

	if ( errors.length > 0 ) {
		process.exit( 1 );
	}
}

/**
 * Embeds external image files as base64 data URIs using reference-style links.
 *
 * Input:  ![alt text](path/to/image.png)
 * Output: ![alt text][label]  (body)
 *         [label]: <data:image/png;base64,BASE64DATA>  (appended at end of file)
 */
function embedImages( inputPath ) {
	const inputDir = path.dirname( inputPath );
	const inputBase = path.basename( inputPath, '.md' );
	const outputPath = path.join( inputDir, `${ inputBase }-embedded.md` );

	const src = fs.readFileSync( inputPath, 'utf8' );

	// Matches inline image references; skips already-embedded data URIs.
	const REF_RE = /!\[([^\]]*)\]\(([^)]+)\)/g;

	// Build a cache of unique file paths to { label, dataUri }, assigning each
	// a unique label derived from the image filename stem.
	const imageCache = new Map(); // imgPath → { label, dataUri }
	const usedLabels = new Set();

	for ( const match of src.matchAll( REF_RE ) ) {
		const imgPath = match[ 2 ];
		if ( imgPath.startsWith( 'data:' ) || imageCache.has( imgPath ) ) {
			continue;
		}
		let label = path.basename( imgPath, path.extname( imgPath ) );
		let unique = label;
		let i = 2;
		while ( usedLabels.has( unique ) ) {
			unique = `${ label }-${ i++ }`;
		}
		usedLabels.add( unique );
		imageCache.set( imgPath, { label: unique, dataUri: null } );
	}

	let count = 0;
	const errors = [];
	const definitions = [];

	for ( const [ imgPath, entry ] of imageCache ) {
		const absPath = path.resolve( inputDir, imgPath );
		try {
			const buffer = fs.readFileSync( absPath );
			const ext = path.extname( imgPath ).slice( 1 ).toLowerCase();
			const mime =
				ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
				ext === 'gif' ? 'image/gif' :
				ext === 'svg' ? 'image/svg+xml' :
				'image/png';
			entry.dataUri = `data:${ mime };base64,${ buffer.toString( 'base64' ) }`;
			definitions.push( `[${ entry.label }]: <${ entry.dataUri }>` );
			console.log( `  ${ imgPath } (${ buffer.length } bytes)` );
			count++;
		} catch ( err ) {
			errors.push( err.message );
			console.error( `  Error reading ${ imgPath }: ${ err.message }` );
		}
	}

	if ( count === 0 && errors.length === 0 ) {
		console.error( 'No external image references found.' );
		process.exit( 1 );
	}

	// Replace inline references with reference-style links.
	let output = src.replace( REF_RE, ( fullMatch, alt, imgPath ) => {
		if ( imgPath.startsWith( 'data:' ) ) {
			return fullMatch;
		}
		const entry = imageCache.get( imgPath );
		return entry && entry.dataUri ? `![${ alt }][${ entry.label }]` : fullMatch;
	} );

	// Append all image definitions at the end of the file.
	if ( definitions.length > 0 ) {
		output = output.trimEnd() + '\n\n' + definitions.join( '\n' ) + '\n';
	}

	fs.writeFileSync( outputPath, output, 'utf8' );
	console.log( `\nDone. ${ count - errors.length }/${ count } images embedded.` );
	console.log( `Output: ${ outputPath }` );

	if ( errors.length > 0 ) {
		process.exit( 1 );
	}
}

function main() {
	const args = process.argv.slice( 2 );
	if ( args.length < 2 ) {
		console.error(
			'Usage: node markdown-convert-embedded-images.js <extract|embed> <input.md>'
		);
		process.exit( 1 );
	}

	const [ command, inputArg ] = args;
	const inputPath = path.resolve( inputArg );

	if ( ! fs.existsSync( inputPath ) ) {
		console.error( `File not found: ${ inputPath }` );
		process.exit( 1 );
	}

	if ( command === 'extract' ) {
		extractImages( inputPath );
	} else if ( command === 'embed' ) {
		embedImages( inputPath );
	} else {
		console.error( `Unknown command: ${ command }. Use 'extract' or 'embed'.` );
		process.exit( 1 );
	}
}

main();
