#!/usr/bin/env node
'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const os = require( 'os' );
const { spawnSync } = require( 'child_process' );

function ensureDir( dirPath ) {
	fs.mkdirSync( dirPath, { recursive: true } );
}

function renderDiagram( body, index, diagramDir ) {
	const paddedIndex = String( index ).padStart( 2, '0' );
	const outFilename = `${ paddedIndex }-diagram.png`;
	const outPngPath = path.join( diagramDir, outFilename );
	const tmpPath = path.join(
		os.tmpdir(),
		`mmd-${ process.pid }-${ index }.mmd`
	);

	fs.writeFileSync( tmpPath, body, 'utf8' );

	const result = spawnSync( 'mmdc', [
		'--input', tmpPath,
		'--output', outPngPath,
		'--backgroundColor', 'transparent',
		'--scale', '3',
	], {
		encoding: 'utf8',
		stdio: 'pipe',
	} );

	try {
		fs.unlinkSync( tmpPath );
	} catch ( _ ) {}

	if ( result.status !== 0 || result.error ) {
		const errMsg =
			result.stderr || result.error?.message || '(no output)';
		throw new Error(
			`mmdc exited ${ result.status } for diagram ${ paddedIndex }:\n${ errMsg }`
		);
	}

	console.log( `  [${ paddedIndex }] → ${ outPngPath }` );
	return outFilename;
}

function main() {
	const args = process.argv.slice( 2 );
	if ( args.length === 0 ) {
		console.error(
			'Usage: node markdown-mermaid-to-png.js <input.md>'
		);
		process.exit( 1 );
	}

	const inputPath = path.resolve( args[ 0 ] );

	if ( ! fs.existsSync( inputPath ) ) {
		console.error( `File not found: ${ inputPath }` );
		process.exit( 1 );
	}

	const inputDir = path.dirname( inputPath );
	const inputBase = path.basename( inputPath, '.md' );
	const diagramDir = path.join( inputDir, 'diagrams' );
	const outputPath = path.join( inputDir, `${ inputBase }-rendered.md` );

	ensureDir( diagramDir );

	const src = fs.readFileSync( inputPath, 'utf8' );

	// Matches fenced mermaid blocks flush with the left margin.
	// The `m` flag makes ^ anchor to line start, so indented fences
	// (inside blockquotes, etc.) are intentionally skipped.
	const MERMAID_FENCE = /^```mermaid\n([\s\S]*?)^```$/gm;

	let diagramIndex = 0;
	const errors = [];

	const rendered = src.replace( MERMAID_FENCE, ( fullMatch, body ) => {
		diagramIndex++;
		try {
			const outFilename = renderDiagram(
				body,
				diagramIndex,
				diagramDir
			);
			return `![Diagram ${ diagramIndex }](diagrams/${ outFilename })`;
		} catch ( err ) {
			errors.push( err.message );
			console.error( `  Error: ${ err.message }` );
			return fullMatch;
		}
	} );

	fs.writeFileSync( outputPath, rendered, 'utf8' );

	console.log(
		`\nDone. ${ diagramIndex - errors.length }/${ diagramIndex } diagrams rendered.`
	);
	console.log( `Output: ${ outputPath }` );

	if ( errors.length > 0 ) {
		process.exit( 1 );
	}
}

main();
