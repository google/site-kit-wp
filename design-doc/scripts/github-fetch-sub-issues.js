#!/usr/bin/env node
'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const { spawnSync } = require( 'child_process' );

const DEFAULT_REPO = 'google/site-kit-wp';
const DEFAULT_OUT_DIR = path.resolve( __dirname, '..', 'issues' );

const USAGE = `Usage: node github-fetch-sub-issues.js <parent-issue-number> [options]

Fetches every sub-issue of the given parent issue and writes each one's body to
a markdown file in <out-dir>/<parent-issue-number>/.

Options:
  -R, --repo <owner/name>  Repository to query (default: ${ DEFAULT_REPO })
  -o, --out <dir>          Parent directory for the output folder
                           (default: ${ DEFAULT_OUT_DIR })
  -h, --help               Show this message

Requires the GitHub CLI, authenticated via \`gh auth login\` or GH_TOKEN.`;

function ensureDir( dirPath ) {
	fs.mkdirSync( dirPath, { recursive: true } );
}

function gh( args ) {
	const result = spawnSync( 'gh', args, {
		encoding: 'utf8',
		stdio: [ 'ignore', 'pipe', 'pipe' ],
		maxBuffer: 64 * 1024 * 1024,
	} );

	if ( result.error ) {
		if ( result.error.code === 'ENOENT' ) {
			throw new Error(
				'`gh` not found. Install the GitHub CLI: https://cli.github.com'
			);
		}
		throw new Error( result.error.message );
	}

	if ( result.status !== 0 ) {
		const stderr = ( result.stderr || '' ).trim() || '(no output)';
		throw new Error( `gh api exited ${ result.status }:\n${ stderr }` );
	}

	return result.stdout;
}

/**
 * Parses `gh api --paginate` output.
 *
 * gh normally merges paginated array responses into a single JSON array, but
 * older versions emit one array per page (`[…][…]`), so join those back up.
 */
function parseJsonPages( stdout ) {
	try {
		return JSON.parse( stdout );
	} catch ( _ ) {
		return JSON.parse( stdout.replace( /\]\s*\[/g, ',' ) );
	}
}

function slugify( title ) {
	return (
		title
			.toLowerCase()
			.replace( /[^a-z0-9]+/g, '-' )
			.replace( /^-+|-+$/g, '' )
			.slice( 0, 60 )
			.replace( /-+$/, '' ) || 'untitled'
	);
}

/**
 * Resolves `owner/name` from an issue's `repository_url`, so sub-issues living
 * in a different repository than their parent are still fetchable.
 */
function repoFromIssue( issue, fallbackRepo ) {
	const match = /\/repos\/([^/]+\/[^/]+)$/.exec( issue.repository_url || '' );
	return match ? match[ 1 ] : fallbackRepo;
}

function fetchSubIssues( repo, parentNumber ) {
	const stdout = gh( [
		'api',
		`repos/${ repo }/issues/${ parentNumber }/sub_issues?per_page=100`,
		'--paginate',
	] );

	return parseJsonPages( stdout );
}

function fetchIssue( repo, number ) {
	return JSON.parse( gh( [ 'api', `repos/${ repo }/issues/${ number }` ] ) );
}

function renderIssueFile( issue ) {
	const body = ( issue.body || '' ).replace( /\r\n/g, '\n' ).trim();
	const labels = ( issue.labels || [] )
		.map( ( label ) => ( typeof label === 'string' ? label : label.name ) )
		.join( ', ' );

	const header = [
		`# ${ issue.number }: ${ issue.title }`,
		'',
		`Source: ${ issue.html_url }`,
		`State: ${ issue.state }${ labels ? ` | Labels: ${ labels }` : '' }`,
	];

	return (
		header.join( '\n' ) +
		'\n\n' +
		( body || '_No description provided._' ) +
		'\n'
	);
}

function parseArgs( argv ) {
	const options = { repo: DEFAULT_REPO, outDir: DEFAULT_OUT_DIR };
	let parentNumber = null;

	for ( let i = 0; i < argv.length; i++ ) {
		const arg = argv[ i ];

		if ( arg === '-h' || arg === '--help' ) {
			console.log( USAGE );
			process.exit( 0 );
		} else if ( arg === '-R' || arg === '--repo' ) {
			options.repo = argv[ ++i ];
		} else if ( arg === '-o' || arg === '--out' ) {
			options.outDir = argv[ ++i ];
		} else if ( arg.startsWith( '-' ) ) {
			throw new Error( `Unknown option: ${ arg }` );
		} else if ( parentNumber === null ) {
			parentNumber = arg.replace( /^#/, '' );
		} else {
			throw new Error( `Unexpected argument: ${ arg }` );
		}
	}

	if ( parentNumber === null ) {
		throw new Error( 'Missing <parent-issue-number>.' );
	}

	if ( ! /^\d+$/.test( parentNumber ) ) {
		throw new Error( `Invalid issue number: ${ parentNumber }` );
	}

	if ( ! options.repo || ! /^[^/\s]+\/[^/\s]+$/.test( options.repo ) ) {
		throw new Error( `Invalid --repo value: ${ options.repo }` );
	}

	if ( ! options.outDir ) {
		throw new Error( 'Missing value for --out.' );
	}

	options.parentNumber = parentNumber;

	return options;
}

function main() {
	let options;

	try {
		options = parseArgs( process.argv.slice( 2 ) );
	} catch ( err ) {
		console.error( `${ err.message }\n\n${ USAGE }` );
		process.exit( 1 );
	}

	const { repo, parentNumber, outDir } = options;
	const issueDir = path.resolve( outDir, parentNumber );

	let subIssues;

	try {
		subIssues = fetchSubIssues( repo, parentNumber );
	} catch ( err ) {
		console.error(
			`Failed to list sub-issues of ${ repo }#${ parentNumber }:\n${ err.message }`
		);
		process.exit( 1 );
	}

	if ( ! Array.isArray( subIssues ) || subIssues.length === 0 ) {
		console.error( `${ repo }#${ parentNumber } has no sub-issues.` );
		process.exit( 1 );
	}

	console.log(
		`${ repo }#${ parentNumber }: ${ subIssues.length } sub-issue(s) → ${ issueDir }`
	);

	ensureDir( issueDir );

	const errors = [];
	let count = 0;

	subIssues.forEach( ( subIssue, index ) => {
		const paddedIndex = String( index + 1 ).padStart( 2, '0' );
		const filename = `${ paddedIndex }-${ subIssue.number }-${ slugify(
			subIssue.title || ''
		) }.md`;
		const outPath = path.join( issueDir, filename );

		try {
			// The sub-issue listing embeds full issue objects, but re-fetch if
			// the body is absent so a partial response still yields content.
			const issue =
				subIssue.body === undefined
					? fetchIssue(
							repoFromIssue( subIssue, repo ),
							subIssue.number
					  )
					: subIssue;

			fs.writeFileSync( outPath, renderIssueFile( issue ), 'utf8' );
			console.log( `  [${ paddedIndex }] #${ issue.number } → ${ filename }` );
			count++;
		} catch ( err ) {
			errors.push( err.message );
			console.error( `  Error fetching #${ subIssue.number }: ${ err.message }` );
		}
	} );

	console.log(
		`\nDone. ${ count }/${ subIssues.length } sub-issues written.`
	);
	console.log( `Output: ${ issueDir }` );

	if ( errors.length > 0 ) {
		process.exit( 1 );
	}
}

main();
