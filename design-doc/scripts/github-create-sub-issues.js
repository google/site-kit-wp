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
linked to the parent. Pass --update to push title and body changes from the
markdown files to issues that were created in a previous run; when
${ STATE_FILENAME } is absent, --update reads each file's GitHub issue number
from its \`Source:\` line (or \`NN-<issue-number>-<slug>.md\` filename).
Pass --update-files to update specific files without comparing against GitHub.

Options:
  -R, --repo <owner/name>  Repository to create the issues in
                           (default: ${ DEFAULT_REPO })
  -o, --output-root <dir>  Root directory of issue markdown files (default: ${ OUTPUT_ROOT })
  -d, --dir <dir>          Directory of issue markdown files (default: the
                           highest-numbered iteration-NN directory under output root)
  -l, --label <names>      Label to apply to every issue. Repeatable, or
                           comma-separated. Labels must already exist in the
                           repository.
  -n, --dry-run            Print what would be created or updated, then exit
  -u, --update             Update title and body of previously created issues
                           when the markdown has changed
      --update-files <names>
                           Update specific issue files by name. Repeatable, or
                           comma-separated. Skips the GitHub diff check.
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
function resolveLatestIterationDir( outputRoot ) {
	if ( ! fs.existsSync( outputRoot ) ) {
		throw new Error( `No issues output directory at ${ outputRoot }.` );
	}

	const iterations = fs
		.readdirSync( outputRoot, { withFileTypes: true } )
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
			`No iteration-NN directories found in ${ outputRoot }. Pass --dir.`
		);
	}

	return path.join( outputRoot, iterations[ iterations.length - 1 ].name );
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
 * Reads a GitHub issue number from a file's header metadata.
 *
 * Fetched or previously synced issues carry a `Source:` URL; files written by
 * `github-fetch-sub-issues.js` also embed the number in the filename.
 */
function parseGithubIssueNumber( contents, filename ) {
	const sourceMatch = contents.match(
		/^Source:\s*https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/issues\/(\d+)\s*$/m
	);

	if ( sourceMatch ) {
		return parseInt( sourceMatch[ 1 ], 10 );
	}

	const filenameMatch = /^(\d+)-(\d+)-/.exec( filename );

	if ( filenameMatch ) {
		return parseInt( filenameMatch[ 2 ], 10 );
	}

	return null;
}

/**
 * Parses an issue file into its title, body, and optional GitHub issue number.
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

	return {
		title,
		body,
		githubNumber: parseGithubIssueNumber(
			contents,
			path.basename( filePath )
		),
	};
}

/**
 * Returns the portion of an issue body that should be pushed to GitHub on update.
 *
 * Synced local files carry metadata (Source, State, etc.) between the title
 * heading and `## Feature Description` / `## Bug Description`; GitHub issues
 * start at that section.
 */
function bodyForGithubUpdate( body ) {
	const lines = body.split( '\n' );
	const descriptionIndex = lines.findIndex( ( line ) =>
		/^##\s+(Feature|Bug) Description\s*$/.test( line )
	);

	if ( descriptionIndex === -1 ) {
		return body.trim();
	}

	return lines.slice( descriptionIndex ).join( '\n' ).trim();
}

function issueNumberFor( issue, state ) {
	return state[ issue.filename ]?.number ?? issue.githubNumber ?? null;
}

function issueLinkedForUpdate( issue, state ) {
	const record = state[ issue.filename ];

	if ( record?.linked ) {
		return true;
	}

	// A synced file header is enough to update an existing GitHub issue.
	return Boolean( ! record?.number && issue.githubNumber );
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

function issueContentMatches( remote, local ) {
	return (
		( remote.title || '' ).trim() === local.title &&
		( remote.body || '' ).trim() === bodyForGithubUpdate( local.body )
	);
}

function updateIssue( repo, number, { title, body } ) {
	return JSON.parse(
		gh(
			[
				'api',
				'--method',
				'PATCH',
				`repos/${ repo }/issues/${ number }`,
				'--input',
				'-',
			],
			JSON.stringify( { title, body } )
		)
	);
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

/**
 * Normalizes update-file arguments to match `NN-<slug>.md` names in the dir.
 */
function normalizeUpdateFilenames( names, knownFilenames ) {
	const known = new Set( knownFilenames );
	const normalized = [];

	for ( const name of names ) {
		const trimmed = name.trim();

		if ( ! trimmed ) {
			continue;
		}

		const basename = path.basename( trimmed );
		const candidates = basename.endsWith( '.md' )
			? [ basename ]
			: [ basename, `${ basename }.md` ];

		const match = candidates.find( ( candidate ) => known.has( candidate ) );

		if ( ! match ) {
			throw new Error(
				`Unknown issue file for --update-files: ${ trimmed }`
			);
		}

		if ( ! normalized.includes( match ) ) {
			normalized.push( match );
		}
	}

	return normalized;
}

function parseArgs( argv ) {
	const options = {
		repo: DEFAULT_REPO,
		outputRoot: OUTPUT_ROOT,
		dir: null,
		labels: [],
		dryRun: false,
		update: false,
		updateFiles: [],
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
		} else if ( arg === '-o' || arg === '--output-root' ) {
			const value = argv[ ++i ];

			if ( ! value ) {
				throw new Error( 'Missing value for --output-root.' );
			}

			options.outputRoot = value;
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
		} else if ( arg === '-u' || arg === '--update' ) {
			options.update = true;
		} else if ( arg === '--update-files' ) {
			const value = argv[ ++i ];

			if ( ! value ) {
				throw new Error( 'Missing value for --update-files.' );
			}

			options.updateFiles.push(
				...value
					.split( ',' )
					.map( ( filename ) => filename.trim() )
					.filter( Boolean )
			);
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

	options.outputRoot = path.resolve( options.outputRoot );
	options.parentNumber = parentNumber;
	options.dir = options.dir
		? path.resolve( options.dir )
		: resolveLatestIterationDir( options.outputRoot );

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

	const { repo, parentNumber, dir, labels, dryRun, update, updateFiles } =
		options;

	let filenames;
	let state;

	try {
		filenames = listIssueFiles( dir );
		state = loadState( dir );
	} catch ( err ) {
		console.error( err.message );
		process.exit( 1 );
	}

	let normalizedUpdateFiles = [];

	try {
		normalizedUpdateFiles = normalizeUpdateFilenames(
			updateFiles,
			filenames
		);
	} catch ( err ) {
		console.error( err.message );
		process.exit( 1 );
	}

	const updateByFilename = normalizedUpdateFiles.length > 0;
	const shouldUpdate = update || updateByFilename;

	if ( updateByFilename && ! update ) {
		console.log(
			'Updating listed files only (--update-files); skipping GitHub diff check.'
		);
		console.log( '' );
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
		( issue ) => ! issueNumberFor( issue, state )
	);
	const linkOnly = issues.filter(
		( issue ) =>
			state[ issue.filename ]?.number &&
			! state[ issue.filename ]?.linked
	);
	const toUpdate = [];
	const updateErrors = [];

	if ( shouldUpdate ) {
		const explicitUpdateFiles = updateByFilename
			? new Set( normalizedUpdateFiles )
			: null;

		for ( const issue of issues ) {
			const number = issueNumberFor( issue, state );

			if ( explicitUpdateFiles ) {
				if ( ! explicitUpdateFiles.has( issue.filename ) ) {
					continue;
				}

				if ( ! number ) {
					updateErrors.push(
						`${ issue.filename }: no issue number in ${ STATE_FILENAME } or file frontmatter`
					);
					continue;
				}

				if ( ! issueLinkedForUpdate( issue, state ) ) {
					updateErrors.push(
						`${ issue.filename }: issue #${ number } was created but not linked`
					);
					continue;
				}

				toUpdate.push( { ...issue, number } );
				continue;
			}

			if ( ! number || ! issueLinkedForUpdate( issue, state ) ) {
				continue;
			}

			try {
				const remote = fetchIssue( repo, number );

				if ( ! issueContentMatches( remote, issue ) ) {
					toUpdate.push( { ...issue, number } );
				}
			} catch ( err ) {
				updateErrors.push(
					`${ issue.filename }: ${ err.message }`
				);
			}
		}
	}

	if ( updateErrors.length > 0 ) {
		console.error(
			'Failed to read existing issues for update check:\n' +
				updateErrors.map( ( message ) => `  ${ message }` ).join( '\n' )
		);
		process.exit( 1 );
	}

	console.log( `Source:  ${ dir }` );
	console.log( `Parent:  ${ repo }#${ parent.number } — ${ parent.title }` );
	console.log(
		`Labels:  ${ labels.length > 0 ? labels.join( ', ' ) : '(none)' }`
	);
	console.log( '' );

	const toUpdateFilenames = new Set(
		toUpdate.map( ( issue ) => issue.filename )
	);

	issues.forEach( ( issue ) => {
		const existing = state[ issue.filename ];
		const number = issueNumberFor( issue, state );
		let status;

		if ( ! number ) {
			status = 'create';
		} else if ( existing?.number && ! existing.linked ) {
			status = `link only (#${ number })`;
		} else if ( toUpdateFilenames.has( issue.filename ) ) {
			status = `update (#${ number })`;
		} else if ( shouldUpdate && number ) {
			status = updateByFilename
				? `skip (already #${ number }, not listed)`
				: `skip (already #${ number }, up to date)`;
		} else {
			status = `skip (already #${ number })`;
		}

		console.log( `  [${ status }] ${ issue.filename }` );
		console.log( `      ${ issue.title }` );
	} );

	if ( skipped.length > 0 ) {
		console.log( '\nNot issue files, ignored:' );
		skipped.forEach( ( filename ) => console.log( `  ${ filename }` ) );
	}

	const alreadyDone =
		issues.length - pending.length - linkOnly.length - toUpdate.length;
	const summaryParts = [];

	if ( pending.length > 0 ) {
		summaryParts.push( `${ pending.length } to create` );
	}

	if ( linkOnly.length > 0 ) {
		summaryParts.push( `${ linkOnly.length } to link` );
	}

	if ( toUpdate.length > 0 ) {
		summaryParts.push( `${ toUpdate.length } to update` );
	}

	if ( alreadyDone > 0 ) {
		summaryParts.push( `${ alreadyDone } already done` );
	}

	console.log( `\n${ summaryParts.join( ', ' ) }.` );

	if ( dryRun ) {
		console.log( '\nDry run — nothing was created or updated.' );
		return;
	}

	if ( pending.length === 0 && linkOnly.length === 0 && toUpdate.length === 0 ) {
		console.log( '\nNothing to do.' );
		return;
	}

	if ( ! options.yes ) {
		let confirmed;
		const actionParts = [];

		if ( pending.length > 0 ) {
			actionParts.push( `create ${ pending.length }` );
		}

		if ( linkOnly.length > 0 ) {
			actionParts.push( `link ${ linkOnly.length }` );
		}

		if ( toUpdate.length > 0 ) {
			actionParts.push( `update ${ toUpdate.length }` );
		}

		try {
			confirmed = await confirm(
				`\n${ actionParts.join( ', ' ) } issue(s) in ${ repo }${
					pending.length > 0 || linkOnly.length > 0
						? ` as sub-issues of #${ parent.number }`
						: ''
				}? [y/N] `
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
	let updatedCount = 0;

	for ( const issue of toUpdate ) {
		try {
			updateIssue( repo, issue.number, {
				title: issue.title,
				body: bodyForGithubUpdate( issue.body ),
			} );

			updatedCount++;
			console.log( `  Updated #${ issue.number } — ${ issue.title }` );
		} catch ( err ) {
			errors.push( `${ issue.filename }: ${ err.message }` );
			console.error( `  Error on ${ issue.filename }: ${ err.message }` );
		}
	}

	for ( const issue of issues ) {
		const existing = state[ issue.filename ];

		if ( ( existing?.number && existing.linked ) || issue.githubNumber ) {
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

	const doneParts = [];

	if ( pending.length > 0 || linkOnly.length > 0 ) {
		doneParts.push(
			`${ linked }/${ issues.length } issues created and linked to #${ parent.number }`
		);
	}

	if ( toUpdate.length > 0 ) {
		doneParts.push( `${ updatedCount }/${ toUpdate.length } issues updated` );
	}

	console.log(
		`\nDone.${ doneParts.length > 0 ? ` ${ doneParts.join( '; ' ) }.` : '' }`
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
