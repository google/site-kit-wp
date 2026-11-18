#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Renders the Mermaid diagrams in a Markdown file to PNGs.
 *
 * Usage: node markdown-mermaid-to-png.ts [--check] <input.md>
 *
 * Replaces each ```mermaid fence with an image linking to the rendered PNG
 * under `diagrams/`, writing `<input>-rendered.md`. With `--check`, renders to
 * a temporary directory to validate the diagrams, and writes nothing next to
 * the input.
 */

/**
 * External dependencies
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

type MmdcCommand = [ command: string, args: string[] ];

function ensureDir( dirPath: string ): void {
	fs.mkdirSync( dirPath, { recursive: true } );
}

function errorMessage( err: unknown ): string {
	return err instanceof Error ? err.message : String( err );
}

/**
 * Returns the command and leading arguments used to run the Mermaid CLI:
 * `mmdc` if it is on the PATH, otherwise `mmdc` fetched on demand via `npx`.
 *
 * @since n.e.x.t
 *
 * @return The command, and an array of arguments to pass before mmdc's own.
 */
function resolveMmdc(): MmdcCommand {
	const probe = spawnSync( 'mmdc', [ '--version' ], { stdio: 'ignore' } );
	if ( ! probe.error ) {
		return [ 'mmdc', [] ];
	}
	return [ 'npx', [ '-y', '-p', '@mermaid-js/mermaid-cli', 'mmdc' ] ];
}

const [ MMDC_COMMAND, MMDC_ARGS ] = resolveMmdc();

function renderDiagram(
	body: string,
	index: number,
	diagramDir: string
): string {
	const paddedIndex = String( index ).padStart( 2, '0' );
	const outFilename = `${ paddedIndex }-diagram.png`;
	const outPngPath = path.join( diagramDir, outFilename );
	const tmpPath = path.join(
		os.tmpdir(),
		`mmd-${ process.pid }-${ index }.mmd`
	);

	fs.writeFileSync( tmpPath, body, 'utf8' );

	// An opaque background keeps dark text legible when the doc is viewed in
	// dark mode.
	const result = spawnSync(
		MMDC_COMMAND,
		[
			...MMDC_ARGS,
			'--input',
			tmpPath,
			'--output',
			outPngPath,
			'--backgroundColor',
			'white',
			'--scale',
			'3',
		],
		{
			encoding: 'utf8',
			stdio: 'pipe',
		}
	);

	try {
		fs.unlinkSync( tmpPath );
	} catch {}

	if ( result.status !== 0 || result.error ) {
		const errMsg = result.stderr || result.error?.message || '(no output)';
		throw new Error(
			`mmdc exited ${ result.status } for diagram ${ paddedIndex }:\n${ errMsg }`
		);
	}

	console.log( `  [${ paddedIndex }] → ${ outPngPath }` );
	return outFilename;
}

function main(): void {
	const args = process.argv.slice( 2 );
	const check = args.includes( '--check' );
	const positional = args.filter( ( arg ) => arg !== '--check' );
	if ( positional.length !== 1 ) {
		console.error(
			'Usage: node markdown-mermaid-to-png.ts [--check] <input.md>\n\n' +
				'  --check  Render every diagram to a temporary directory to validate\n' +
				'           it, without writing anything next to the input.'
		);
		process.exit( 1 );
	}

	const inputPath = path.resolve( positional[ 0 ] );

	if ( ! fs.existsSync( inputPath ) ) {
		console.error( `File not found: ${ inputPath }` );
		process.exit( 1 );
	}

	const inputDir = path.dirname( inputPath );
	const inputBase = path.basename( inputPath, '.md' );
	const diagramDir = check
		? fs.mkdtempSync( path.join( os.tmpdir(), 'mmd-check-' ) )
		: path.join( inputDir, 'diagrams' );
	const outputPath = path.join( inputDir, `${ inputBase }-rendered.md` );

	ensureDir( diagramDir );

	// Remove previously rendered diagrams, so a diagram deleted from the doc
	// doesn't leave a stale PNG behind.
	for ( const file of fs.readdirSync( diagramDir ) ) {
		if ( /^\d+-diagram\.png$/.test( file ) ) {
			fs.unlinkSync( path.join( diagramDir, file ) );
		}
	}

	const src = fs.readFileSync( inputPath, 'utf8' );

	// Matches fenced mermaid blocks flush with the left margin.
	// The `m` flag makes ^ anchor to line start, so indented fences
	// (inside blockquotes, etc.) are intentionally skipped.
	const MERMAID_FENCE = /^```mermaid\n([\s\S]*?)^```$/gm;

	let diagramIndex = 0;
	const errors: string[] = [];

	const rendered = src.replace(
		MERMAID_FENCE,
		( fullMatch: string, body: string ) => {
			diagramIndex++;
			try {
				const outFilename = renderDiagram(
					body,
					diagramIndex,
					diagramDir
				);
				return `![Diagram ${ diagramIndex }](diagrams/${ outFilename })`;
			} catch ( err ) {
				errors.push( errorMessage( err ) );
				console.error( `  Error: ${ errorMessage( err ) }` );
				return fullMatch;
			}
		}
	);

	console.log(
		`\nDone. ${
			diagramIndex - errors.length
		}/${ diagramIndex } diagrams rendered.`
	);

	if ( check ) {
		fs.rmSync( diagramDir, { recursive: true, force: true } );
	} else {
		fs.writeFileSync( outputPath, rendered, 'utf8' );
		console.log( `Output: ${ outputPath }` );
	}

	if ( errors.length > 0 ) {
		process.exit( 1 );
	}
}

main();
