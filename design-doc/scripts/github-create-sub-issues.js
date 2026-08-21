#!/usr/bin/env node
'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const readline = require( 'readline' );
const { spawnSync } = require( 'child_process' );

const DEFAULT_REPO = 'google/site-kit-wp';
const OUTPUT_ROOT = path.resolve( __dirname, '..', 'issues', 'output' );
const STATE_FILENAME = 'created-issues.json';

const USAGE = `Usage: node github-create-sub-issues.js <parent-issue-number> [options]

Creates a GitHub issue from each markdown file in an issues directory and
attaches it to the given parent issue as a sub-issue, in filename order.

Each file is expected to open with a \`# <n>: <title>\` heading: the heading
supplies the issue title (with the leading number dropped) and everything below
it becomes the issue body.

Created issues are recorded in <dir>/${ STATE_FILENAME }, so re-running skips
files that already have an issue and retries any that were created but not
linked to the parent.

Options:
  -R, --repo <owner/name>  Repository to create the issues in
                           (default: ${ DEFAULT_REPO })
  -d, --dir <dir>          Directory of issue markdown files (default: the
                           highest-numbered iteration-NN directory under
                           ${ OUTPUT_ROOT })
  -l, --label <names>      Label to apply to every issue. Repeatable, or
                           comma-separated. Labels must already exist in the
                           repository.
  -n, --dry-run            Print what would be created, then exit
  -y, --yes                Skip the confirmation prompt
  -h, --help               Show this message

Requires the GitHub CLI, authenticated via \`gh auth login\` or GH_TOKEN.`;

function gh( args, input ) {
	const result = spawnSync( 'gh', args, {
		encoding: 'utf8',
		input,
		stdio: [ input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe' ],
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
 * Finds the highest-numbered `iteration-NN` directory under the issues output
 * root, so the script defaults to the most recent set of drafted issues.
 */
function resolveLatestIterationDir() {
	if ( ! fs.existsSync( OUTPUT_ROOT ) ) {
		throw new Error( `No issues output directory at ${ OUTPUT_ROOT }.` );
	}

	const iterations = fs
		.readdirSync( OUTPUT_ROOT, { withFileTypes: true } )
		.filter( ( entry ) => entry.isDirectory() )
		.map( ( entry ) => /^iteration-(\d+)$/.exec( entry.name ) )
		.filter( Boolean )
		.map( ( match ) => ( {
			name: match[ 0 ],
			number: parseInt( match[ 1 ], 10 ),
		} ) )
		.sort( ( a, b ) => a.number - b.number );

	if ( iterations.length === 0 ) {
		throw new Error(
			`No iteration-NN directories found in ${ OUTPUT_ROOT }. Pass --dir.`
		);
	}

	return path.join( OUTPUT_ROOT, iterations[ iterations.length - 1 ].name );
}

/**
 * Lists the candidate issue files in a directory, in filename order.
 *
 * Issues are named `NN-<slug>.md`, which the working copies of the prompt and
 * the introduction that sit alongside them can also match — those are filtered
 * out by content in `parseIssueFile()`.
 */
function listIssueFiles( dir ) {
	if ( ! fs.existsSync( dir ) ) {
		throw new Error( `Directory not found: ${ dir }` );
	}

	return fs
		.readdirSync( dir )
		.filter( ( name ) => /^\d+-.+\.md$/.test( name ) )
		.sort();
}

/**
 * Parses an issue file into its title and body.
 *
 * Returns null for a markdown file that isn't an issue — i.e. one carrying
 * neither of the template's description headings.
 */
function parseIssueFile( filePath ) {
	const contents = fs
		.readFileSync( filePath, 'utf8' )
		.replace( /\r\n/g, '\n' );

	if ( ! /^##\s+(Feature|Bug) Description\s*$/m.test( contents ) ) {
		return null;
	}

	const lines = contents.split( '\n' );
	const headingIndex = lines.findIndex( ( line ) => /^#\s+\S/.test( line ) );

	if ( headingIndex === -1 ) {
		throw new Error( 'no `# <title>` heading found' );
	}

	// Drop the draft's leading issue number: `# 3: Add the …` → `Add the …`.
	const title = lines[ headingIndex ]
		.replace( /^#\s+/, '' )
		.replace( /^\d+\s*[:.]\s+/, '' )
		.trim();
	const body = lines
		.slice( headingIndex + 1 )
		.join( '\n' )
		.trim();

	if ( ! title ) {
		throw new Error( 'empty issue title' );
	}

	if ( ! body ) {
		throw new Error( 'empty issue body' );
	}

	return { title, body };
}

function stateFilePath( dir ) {
	return path.join( dir, STATE_FILENAME );
}

function loadState( dir ) {
	const filePath = stateFilePath( dir );

	if ( ! fs.existsSync( filePath ) ) {
		return {};
	}

	try {
		const state = JSON.parse( fs.readFileSync( filePath, 'utf8' ) );
		return state && typeof state === 'object' ? state : {};
	} catch ( err ) {
		throw new Error(
			`Could not parse ${ filePath }: ${ err.message }. Fix or remove it before re-running.`
		);
	}
}

function saveState( dir, state ) {
	fs.writeFileSync(
		stateFilePath( dir ),
		JSON.stringify( state, null, '\t' ) + '\n',
		'utf8'
	);
}

function fetchIssue( repo, number ) {
	return JSON.parse( gh( [ 'api', `repos/${ repo }/issues/${ number }` ] ) );
}

function createIssue( repo, { title, body, labels } ) {
	const payload = { title, body };

	if ( labels.length > 0 ) {
		payload.labels = labels;
	}

	return JSON.parse(
		gh(
			[
				'api',
				'--method',
				'POST',
				`repos/${ repo }/issues`,
				'--input',
				'-',
			],
			JSON.stringify( payload )
		)
	);
}

/**
 * Attaches an issue to a parent as a sub-issue.
 *
 * Note the sub-issues API keys on the child's database `id`, not its number.
 */
function addSubIssue( repo, parentNumber, subIssueID ) {
	gh(
		[
			'api',
			'--method',
			'POST',
			`repos/${ repo }/issues/${ parentNumber }/sub_issues`,
			'--input',
			'-',
		],
		JSON.stringify( { sub_issue_id: subIssueID } )
	);
}

function confirm( question ) {
	if ( ! process.stdin.isTTY ) {
		throw new Error(
			'Refusing to create issues without confirmation. Re-run with --yes (or --dry-run).'
		);
	}

	const rl = readline.createInterface( {
		input: process.stdin,
		output: process.stdout,
	} );

	return new Promise( ( resolve ) => {
		rl.question( question, ( answer ) => {
			rl.close();
			resolve( /^y(es)?$/i.test( answer.trim() ) );
		} );
	} );
}

function parseArgs( argv ) {
	const options = {
		repo: DEFAULT_REPO,
		dir: null,
		labels: [],
		dryRun: false,
		yes: false,
	};
	let parentNumber = null;

	for ( let i = 0; i < argv.length; i++ ) {
		const arg = argv[ i ];

		if ( arg === '-h' || arg === '--help' ) {
			console.log( USAGE );
			process.exit( 0 );
		} else if ( arg === '-R' || arg === '--repo' ) {
			options.repo = argv[ ++i ];
		} else if ( arg === '-d' || arg === '--dir' ) {
			options.dir = argv[ ++i ];
		} else if ( arg === '-l' || arg === '--label' ) {
			const value = argv[ ++i ];

			if ( ! value ) {
				throw new Error( 'Missing value for --label.' );
			}

			options.labels.push(
				...value
					.split( ',' )
					.map( ( label ) => label.trim() )
					.filter( Boolean )
			);
		} else if ( arg === '-n' || arg === '--dry-run' ) {
			options.dryRun = true;
		} else if ( arg === '-y' || arg === '--yes' ) {
			options.yes = true;
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

	if ( options.dir === undefined ) {
		throw new Error( 'Missing value for --dir.' );
	}

	options.parentNumber = parentNumber;
	options.dir = options.dir
		? path.resolve( options.dir )
		: resolveLatestIterationDir();

	return options;
}

async function main() {
	let options;

	try {
		options = parseArgs( process.argv.slice( 2 ) );
	} catch ( err ) {
		console.error( `${ err.message }\n\n${ USAGE }` );
		process.exit( 1 );
	}

	const { repo, parentNumber, dir, labels, dryRun } = options;

	let filenames;
	let state;

	try {
		filenames = listIssueFiles( dir );
		state = loadState( dir );
	} catch ( err ) {
		console.error( err.message );
		process.exit( 1 );
	}

	if ( filenames.length === 0 ) {
		console.error( `No NN-<slug>.md issue files found in ${ dir }.` );
		process.exit( 1 );
	}

	// Parse every file up front, so a malformed draft fails before anything is
	// created on GitHub.
	const issues = [];
	const skipped = [];

	for ( const filename of filenames ) {
		try {
			const parsed = parseIssueFile( path.join( dir, filename ) );

			if ( parsed ) {
				issues.push( { filename, ...parsed } );
			} else {
				skipped.push( filename );
			}
		} catch ( err ) {
			console.error( `${ filename }: ${ err.message }` );
			process.exit( 1 );
		}
	}

	if ( issues.length === 0 ) {
		console.error( `No issue files found in ${ dir }.` );
		process.exit( 1 );
	}

	let parent;

	try {
		parent = fetchIssue( repo, parentNumber );
	} catch ( err ) {
		console.error(
			`Failed to read parent issue ${ repo }#${ parentNumber }:\n${ err.message }`
		);
		process.exit( 1 );
	}

	const pending = issues.filter(
		( issue ) => ! state[ issue.filename ]?.number
	);
	const linkOnly = issues.filter(
		( issue ) =>
			state[ issue.filename ]?.number && ! state[ issue.filename ]?.linked
	);

	console.log( `Source:  ${ dir }` );
	console.log( `Parent:  ${ repo }#${ parent.number } — ${ parent.title }` );
	console.log(
		`Labels:  ${ labels.length > 0 ? labels.join( ', ' ) : '(none)' }`
	);
	console.log( '' );

	issues.forEach( ( issue ) => {
		const existing = state[ issue.filename ];
		const status = ! existing?.number
			? 'create'
			: existing.linked
			? `skip (already #${ existing.number })`
			: `link only (#${ existing.number })`;

		console.log( `  [${ status }] ${ issue.filename }` );
		console.log( `      ${ issue.title }` );
	} );

	if ( skipped.length > 0 ) {
		console.log( '\nNot issue files, ignored:' );
		skipped.forEach( ( filename ) => console.log( `  ${ filename }` ) );
	}

	console.log(
		`\n${ pending.length } to create, ${ linkOnly.length } to link, ${
			issues.length - pending.length - linkOnly.length
		} already done.`
	);

	if ( dryRun ) {
		console.log( '\nDry run — nothing was created.' );
		return;
	}

	if ( pending.length === 0 && linkOnly.length === 0 ) {
		console.log( '\nNothing to do.' );
		return;
	}

	if ( ! options.yes ) {
		let confirmed;

		try {
			confirmed = await confirm(
				`\nCreate ${ pending.length } issue(s) in ${ repo } as sub-issues of #${ parent.number }? [y/N] `
			);
		} catch ( err ) {
			console.error( `\n${ err.message }` );
			process.exit( 1 );
		}

		if ( ! confirmed ) {
			console.log( 'Aborted.' );
			return;
		}
	}

	console.log( '' );

	const errors = [];

	for ( const issue of issues ) {
		const existing = state[ issue.filename ];

		if ( existing?.number && existing.linked ) {
			continue;
		}

		try {
			let record = existing;

			if ( ! record?.number ) {
				const created = createIssue( repo, {
					title: issue.title,
					body: issue.body,
					labels,
				} );

				record = {
					number: created.number,
					id: created.id,
					url: created.html_url,
					linked: false,
				};

				// Persist before linking, so a failure here can't orphan an
				// issue that a re-run would then duplicate.
				state[ issue.filename ] = record;
				saveState( dir, state );

				console.log( `  Created #${ record.number } — ${ issue.title }` );
			}

			addSubIssue( repo, parentNumber, record.id );

			record.linked = true;
			state[ issue.filename ] = record;
			saveState( dir, state );

			console.log( `  Linked  #${ record.number } → #${ parent.number }` );
		} catch ( err ) {
			errors.push( `${ issue.filename }: ${ err.message }` );
			console.error( `  Error on ${ issue.filename }: ${ err.message }` );
		}
	}

	const linked = issues.filter(
		( issue ) => state[ issue.filename ]?.linked
	).length;

	console.log(
		`\nDone. ${ linked }/${ issues.length } issues created and linked to #${ parent.number }.`
	);
	console.log( `State: ${ stateFilePath( dir ) }` );

	if ( errors.length > 0 ) {
		console.error( `\n${ errors.length } error(s). Re-run to retry.` );
		process.exit( 1 );
	}
}

main().catch( ( err ) => {
	console.error( err.message );
	process.exit( 1 );
} );
