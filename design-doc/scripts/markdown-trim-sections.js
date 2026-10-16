#!/usr/bin/env node
'use strict';

const fs = require( 'fs' );
const path = require( 'path' );

const DEFAULT_SECTIONS = [ 'Feature Description|Bug Description', 'Acceptance criteria' ];

const USAGE = `Usage: node markdown-trim-sections.js <dir|file...> [options]

Trims markdown files down to the named sections, dropping everything else. A
section is a heading plus its content, including any deeper nested headings,
up to the next heading at the same or shallower level.

Default sections: ${ DEFAULT_SECTIONS.map( ( s ) => `"${ s }"` ).join( ', ' ) }

Options:
  -s, --section <name>  Section to keep; repeatable, or comma-separated.
                        Replaces the defaults entirely. Matching ignores case
                        and matches headings at any level, including ones with
                        a trailing suffix ("QA Brief" matches "QA Brief (QA:Eng)").
                        Join names with "|" to accept whichever is present
                        without warning about the other, e.g.
                        -s "Feature Description|Bug Description".
  -o, --out <dir>       Write trimmed files here (default: <input-dir>-trimmed)
  -i, --in-place        Overwrite the input files instead
      --strip-title     Drop the leading level-1 title block as well
      --list            Print the headings found in each file and exit
  -n, --dry-run         Report what would be written without writing it
  -h, --help            Show this message`;

function ensureDir( dirPath ) {
	fs.mkdirSync( dirPath, { recursive: true } );
}

/**
 * Normalises a heading for comparison: strips markdown emphasis and inline
 * code markers, collapses whitespace, drops a trailing colon, and lowercases.
 */
function normalizeHeading( title ) {
	return title
		.replace( /[*_`]/g, '' )
		.replace( /\s+/g, ' ' )
		.trim()
		.replace( /:$/, '' )
		.toLowerCase();
}

/**
 * A requested name matches a heading when the normalised forms are equal, or
 * when the heading continues with a non-word character — so "QA Brief" matches
 * "QA Brief (QA:Eng)" but never "QA Briefing".
 */
function headingMatches( heading, wanted ) {
	if ( heading === wanted ) {
		return true;
	}

	return (
		heading.startsWith( wanted ) &&
		/[^a-z0-9]/.test( heading.charAt( wanted.length ) )
	);
}

/**
 * Splits markdown into a leading preamble plus a flat list of heading blocks.
 * Headings inside fenced code blocks are ignored.
 */
function parseSections( src ) {
	const lines = src.replace( /\r\n/g, '\n' ).split( '\n' );
	const HEADING_RE = /^(#{1,6})\s+(.*)$/;
	const FENCE_RE = /^\s*(```+|~~~+)/;

	const preamble = [];
	const sections = [];
	let fence = null;
	let current = null;

	for ( const line of lines ) {
		const fenceMatch = FENCE_RE.exec( line );

		if ( fenceMatch ) {
			const marker = fenceMatch[ 1 ].charAt( 0 );
			if ( fence === null ) {
				fence = marker;
			} else if ( fence === marker ) {
				fence = null;
			}
		}

		const heading = fence === null ? HEADING_RE.exec( line ) : null;

		if ( heading ) {
			current = {
				level: heading[ 1 ].length,
				title: heading[ 2 ].trim(),
				headingLine: line,
				content: [],
			};
			sections.push( current );
		} else if ( current ) {
			current.content.push( line );
		} else {
			preamble.push( line );
		}
	}

	return { preamble, sections };
}

function renderBlock( section, extraContent ) {
	const body = [ ...section.content, ...( extraContent || [] ) ]
		.join( '\n' )
		.replace( /\n{3,}/g, '\n\n' )
		.trim();

	return body
		? `${ section.headingLine }\n\n${ body }`
		: section.headingLine;
}

/**
 * Trims a single file's source, returning the new content plus the names of
 * requested sections that were not found.
 */
function trimSource( src, wanted, stripTitle ) {
	const { preamble, sections } = parseSections( src );
	const blocks = [];
	const matchedSpecs = [];

	// The fetch script writes a level-1 title block (`# <number>: <title>` plus
	// the source/state metadata) ahead of the issue body. Keep it, but only its
	// own content — never let it swallow the sections that follow.
	const hasTitleBlock = sections.length > 0 && sections[ 0 ].level === 1;
	const firstBodyIndex = hasTitleBlock ? 1 : 0;

	if ( hasTitleBlock && ! stripTitle ) {
		blocks.push( renderBlock( sections[ 0 ] ) );
	}

	for ( let i = firstBodyIndex; i < sections.length; i++ ) {
		const section = sections[ i ];
		const heading = normalizeHeading( section.title );
		const match = wanted.find( ( name ) =>
			name.alternates.some( ( alternate ) =>
				headingMatches( heading, alternate )
			)
		);

		if ( ! match ) {
			continue;
		}

		// Absorb any nested subsections, which end at the next heading of the
		// same or a shallower level.
		const nested = [];
		let j = i + 1;
		while ( j < sections.length && sections[ j ].level > section.level ) {
			nested.push( sections[ j ].headingLine, ...sections[ j ].content );
			j++;
		}

		blocks.push( renderBlock( section, nested ) );
		matchedSpecs.push( match.spec );
		i = j - 1;
	}

	const missing = wanted
		.filter( ( name ) => ! matchedSpecs.includes( name.spec ) )
		.map( ( name ) => name.spec );

	// Content before the very first heading is rare in issue bodies, but keep
	// it when there is no title block to carry it.
	const lead = hasTitleBlock ? '' : preamble.join( '\n' ).trim();
	const output = [ lead, ...blocks ].filter( Boolean ).join( '\n\n' );

	return { output: output ? `${ output }\n` : '', missing };
}

function collectFiles( inputs ) {
	const files = [];
	let inputDir = null;

	for ( const input of inputs ) {
		const resolved = path.resolve( input );

		if ( ! fs.existsSync( resolved ) ) {
			throw new Error( `Not found: ${ input }` );
		}

		if ( fs.statSync( resolved ).isDirectory() ) {
			const found = fs
				.readdirSync( resolved )
				.filter( ( name ) => name.toLowerCase().endsWith( '.md' ) )
				.sort()
				.map( ( name ) => path.join( resolved, name ) );

			if ( found.length === 0 ) {
				throw new Error( `No .md files in ${ input }` );
			}

			files.push( ...found );
			inputDir = inputDir || resolved;
		} else {
			files.push( resolved );
			inputDir = inputDir || path.dirname( resolved );
		}
	}

	return { files, inputDir };
}

function parseArgs( argv ) {
	const options = {
		inputs: [],
		sections: [],
		outDir: null,
		inPlace: false,
		stripTitle: false,
		list: false,
		dryRun: false,
	};

	for ( let i = 0; i < argv.length; i++ ) {
		const arg = argv[ i ];

		if ( arg === '-h' || arg === '--help' ) {
			console.log( USAGE );
			process.exit( 0 );
		} else if ( arg === '-s' || arg === '--section' ) {
			const value = argv[ ++i ];
			if ( ! value ) {
				throw new Error( 'Missing value for --section.' );
			}
			options.sections.push(
				...value
					.split( ',' )
					.map( ( name ) => name.trim() )
					.filter( Boolean )
			);
		} else if ( arg === '-o' || arg === '--out' ) {
			options.outDir = argv[ ++i ];
			if ( ! options.outDir ) {
				throw new Error( 'Missing value for --out.' );
			}
		} else if ( arg === '-i' || arg === '--in-place' ) {
			options.inPlace = true;
		} else if ( arg === '--strip-title' ) {
			options.stripTitle = true;
		} else if ( arg === '--list' ) {
			options.list = true;
		} else if ( arg === '-n' || arg === '--dry-run' ) {
			options.dryRun = true;
		} else if ( arg.startsWith( '-' ) ) {
			throw new Error( `Unknown option: ${ arg }` );
		} else {
			options.inputs.push( arg );
		}
	}

	if ( options.inputs.length === 0 ) {
		throw new Error( 'Missing <dir|file...>.' );
	}

	if ( options.inPlace && options.outDir ) {
		throw new Error( 'Use either --in-place or --out, not both.' );
	}

	if ( options.sections.length === 0 ) {
		options.sections = [ ...DEFAULT_SECTIONS ];
	}

	return options;
}

function listHeadings( files ) {
	for ( const file of files ) {
		const { sections } = parseSections(
			fs.readFileSync( file, 'utf8' )
		);
		console.log( path.basename( file ) );
		for ( const section of sections ) {
			console.log(
				`  ${ '#'.repeat( section.level ) } ${ section.title }`
			);
		}
	}
}

function main() {
	let options;

	try {
		options = parseArgs( process.argv.slice( 2 ) );
	} catch ( err ) {
		console.error( `${ err.message }\n\n${ USAGE }` );
		process.exit( 1 );
	}

	let files;
	let inputDir;

	try {
		( { files, inputDir } = collectFiles( options.inputs ) );
	} catch ( err ) {
		console.error( err.message );
		process.exit( 1 );
	}

	if ( options.list ) {
		listHeadings( files );
		return;
	}

	const wanted = options.sections.map( ( name ) => ( {
		spec: name,
		alternates: name
			.split( '|' )
			.map( ( alternate ) => normalizeHeading( alternate ) )
			.filter( Boolean ),
	} ) );

	const outDir = options.inPlace
		? null
		: path.resolve( options.outDir || `${ inputDir }-trimmed` );

	console.log(
		`Keeping: ${ options.sections.map( ( s ) => `"${ s }"` ).join( ', ' ) }`
	);
	console.log(
		`${ files.length } file(s) → ${
			options.inPlace ? 'in place' : outDir
		}${ options.dryRun ? ' (dry run)' : '' }\n`
	);

	if ( ! options.inPlace && ! options.dryRun ) {
		ensureDir( outDir );
	}

	const errors = [];
	const warnings = [];
	let count = 0;

	for ( const file of files ) {
		const name = path.basename( file );

		try {
			const src = fs.readFileSync( file, 'utf8' );
			// Measure before writing — an in-place write replaces the file the
			// original size would otherwise be read back from.
			const before = Buffer.byteLength( src, 'utf8' );
			const { output, missing } = trimSource(
				src,
				wanted,
				options.stripTitle
			);

			if ( missing.length === wanted.length ) {
				warnings.push(
					`${ name }: no requested sections found — skipped.`
				);
				console.error( `  ! ${ name }: no requested sections found` );
				continue;
			}

			if ( missing.length > 0 ) {
				warnings.push(
					`${ name }: missing ${ missing
						.map( ( s ) => `"${ s }"` )
						.join( ', ' ) }`
				);
				console.error(
					`  ! ${ name }: missing ${ missing
						.map( ( s ) => `"${ s }"` )
						.join( ', ' ) }`
				);
			}

			if ( ! options.dryRun ) {
				fs.writeFileSync(
					options.inPlace ? file : path.join( outDir, name ),
					output,
					'utf8'
				);
			}

			const after = Buffer.byteLength( output, 'utf8' );
			console.log(
				`  ${ name } (${ before } → ${ after } bytes)`
			);
			count++;
		} catch ( err ) {
			errors.push( err.message );
			console.error( `  Error trimming ${ name }: ${ err.message }` );
		}
	}

	console.log( `\nDone. ${ count }/${ files.length } files trimmed.` );

	if ( warnings.length > 0 ) {
		console.log( `\n${ warnings.length } warning(s):` );
		for ( const warning of warnings ) {
			console.log( `  ${ warning }` );
		}
	}

	if ( ! options.dryRun && ! options.inPlace ) {
		console.log( `\nOutput: ${ outDir }` );
	}

	if ( errors.length > 0 ) {
		process.exit( 1 );
	}
}

main();
