/**
 * Visual regression test report.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
const crypto = require( 'crypto' );
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { SCREENSHOTS_DIR } = require( './constants' );

// The page that shows the report, copied next to its data.
const APP_DIR = path.join( __dirname, 'report-app' );
const APP_FILES = [ 'index.html', 'app.js', 'app.css' ];

// Playwright colors its error messages.
const ANSI_PATTERN = new RegExp(
	`${ String.fromCharCode( 27 ) }\\[[0-9;]*m`,
	'g'
);

// The message `toHaveScreenshot()` fails with when there's no reference image.
const NEW_MESSAGE = "A snapshot doesn't exist at";

// The images an attempt at a test can have, besides the reference image.
const NO_IMAGES = { actual: null, diff: null, previous: null, failure: null };

/**
 * Removes terminal colors from a Playwright error.
 *
 * @since n.e.x.t
 *
 * @param {Object} error A Playwright `TestError`.
 * @return {string} The error's message (or value, or stack), without colors.
 */
function formatError( error ) {
	return String( error.message || error.value || error.stack || '' ).replace(
		ANSI_PATTERN,
		''
	);
}

/**
 * Identifies the images Playwright attaches to a failed screenshot.
 *
 * `toHaveScreenshot()` attaches `<name>-expected.png` (the reference image, which
 * this report copies from `__screenshots__/` instead), `<name>-actual.png`,
 * `<name>-diff.png` and, when the page kept changing, `<name>-previous.png`.
 * `fixtures.js` attaches `failure.png` when a test fails before its screenshot.
 *
 * @since n.e.x.t
 *
 * @param {Object} attachment A Playwright attachment.
 * @return {string|null} The kind of image, or `null` for other attachments.
 */
function getImageKind( attachment ) {
	if ( attachment.contentType !== 'image/png' ) {
		return null;
	}

	if ( attachment.name === 'failure.png' ) {
		return 'failure';
	}

	const match = attachment.name.match( /-(actual|diff|previous)\.png$/ );

	return match ? match[ 1 ] : null;
}

/**
 * Gets a test's status in the report.
 *
 * @since n.e.x.t
 *
 * @param {Object} test  The Playwright test case.
 * @param {string} error The first error of the attempt the report shows.
 * @return {string} `failed`, `new`, `flaky`, `notRun` or `passed`.
 */
function getStatus( test, error ) {
	switch ( test.outcome() ) {
		case 'expected':
			return 'passed';
		case 'flaky':
			return 'flaky';
		case 'skipped':
			// Interrupted, or not started because of `maxFailures`.
			return 'notRun';
		default:
			// Playwright doesn't retry a test without a reference image.
			return error.includes( NEW_MESSAGE ) ? 'new' : 'failed';
	}
}

/**
 * Reads the dimensions of a PNG image from its header.
 *
 * @since n.e.x.t
 *
 * @param {Buffer} contents The image.
 * @return {Object} Its `width` and `height` in pixels, `null` if unknown.
 */
function getPNGSize( contents ) {
	// The 8-byte signature, then the `IHDR` chunk: length, type, width, height.
	if ( contents.toString( 'latin1', 12, 16 ) !== 'IHDR' ) {
		return { width: null, height: null };
	}

	return {
		width: contents.readUInt32BE( 16 ),
		height: contents.readUInt32BE( 20 ),
	};
}

/**
 * Summarizes how a failed test's screenshot differs from its reference image.
 *
 * @since n.e.x.t
 *
 * @param {string}      status The entry's status.
 * @param {string}      error  The first error message.
 * @param {number|null} area   The screenshot's area in pixels, if known.
 * @return {string} The summary.
 */
function summarizeDifference( status, error, area ) {
	if ( status === 'new' ) {
		return 'No reference image yet.';
	}

	const size = error.match(
		/Expected an image (\d+)px by (\d+)px, received (\d+)px by (\d+)px/
	);

	if ( size ) {
		return `Size changed from ${ size[ 1 ] }×${ size[ 2 ] } to ${ size[ 3 ] }×${ size[ 4 ] }.`;
	}

	const pixels = error.match(
		/(\d+) pixels? \(ratio [\d.]+ of all image pixels\)/
	);

	if ( pixels ) {
		const count = Number( pixels[ 1 ] );
		// Playwright rounds the ratio up to two decimals, so work it out here.
		const percentage = area ? ( count / area ) * 100 : null;
		let share = '';

		if ( percentage !== null ) {
			share =
				percentage < 0.01
					? ' (under 0.01% of the image)'
					: ` (${ percentage.toFixed( 2 ) }% of the image)`;
		}

		return `${ count.toLocaleString( 'en-US' ) } pixels differ${ share }.`;
	}

	if (
		error.includes( 'Failed to take two consecutive stable screenshots' )
	) {
		return 'The page kept changing, so no stable screenshot could be taken.';
	}

	return error.split( '\n' ).find( ( line ) => line.trim() ) || '';
}

/**
 * Summarizes a problem with a test, for its card.
 *
 * @since n.e.x.t
 *
 * @param {string}      status The entry's status.
 * @param {string}      error  The first error message.
 * @param {Object|null} actual The test's screenshot, if it has one.
 * @return {string} The summary, or an empty string if there's no problem.
 */
function getSummary( status, error, actual ) {
	if ( status === 'passed' || status === 'notRun' ) {
		return '';
	}

	const summary = summarizeDifference(
		status,
		error,
		actual && actual.width * actual.height
	);

	return status === 'flaky'
		? `Passed on retry. The first attempt failed: ${ summary }`
		: summary;
}

/**
 * Builds the command that writes a new reference image for one test.
 *
 * `--grep` matches the test's title path (`<project> vrt.spec.js <label>`)
 * followed by its tags, so the pattern is anchored to match this story only.
 *
 * @since n.e.x.t
 *
 * @param {string} label    The story's label.
 * @param {string} viewport The viewport (Playwright project).
 * @return {string} The command.
 */
function getApproveCommand( label, viewport ) {
	const pattern = `vrt\\.spec\\.js ${ label.replace(
		/[.*+?^${}()|[\]\\]/g,
		'\\$&'
	) }( @|$)`;

	return `npm run test:visualapprove -- --project=${ viewport } --grep '${ pattern.replace(
		/'/g,
		"'\\''"
	) }'`;
}

/**
 * Generates a gallery of every screenshot: the reference image of every story
 * and viewport, and the screenshot and diff of every failure.
 *
 * Used as a Playwright reporter: in `playwright.config.js` for local runs, and in
 * `merge.config.js` when CI merges the reports of its shards. Playwright doesn't
 * wait for promises returned by reporters, so everything here is synchronous.
 *
 * @since n.e.x.t
 */
class VRTReporter {
	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} [options]           Reporter options.
	 * @param {string} [options.outputDir] Where to write the report, relative to
	 *                                     `tests/vrt`.
	 */
	constructor( { outputDir = 'report' } = {} ) {
		this.outputDir = path.resolve( __dirname, outputDir );
		this.attempts = new Map();
		this.errors = [];
	}

	/**
	 * Tells Playwright this reporter doesn't print, so others can.
	 *
	 * @since n.e.x.t
	 *
	 * @return {boolean} `false`.
	 */
	printsToStdio() {
		return false;
	}

	/**
	 * Starts a new report.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} config The Playwright config.
	 * @param {Object} suite  The root suite.
	 */
	onBegin( config, suite ) {
		this.suite = suite;
		this.startTime = new Date();

		fs.rmSync( this.outputDir, { recursive: true, force: true } );
		fs.mkdirSync( path.join( this.outputDir, 'images', 'results' ), {
			recursive: true,
		} );
	}

	/**
	 * Records one attempt at a test, and copies its images.
	 *
	 * Attachments are copied right away: locally, they live in `test-results/`.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} test   The Playwright test case.
	 * @param {Object} result The result of this attempt.
	 */
	onTestEnd( test, result ) {
		const images = { ...NO_IMAGES };

		for ( const attachment of result.attachments ) {
			const kind = getImageKind( attachment );

			if ( kind ) {
				images[ kind ] = this.copyImage( attachment );
			}
		}

		const attempts = this.attempts.get( test.id ) || [];

		attempts.push( {
			status: result.status,
			errors: result.errors.map( formatError ),
			images,
		} );
		this.attempts.set( test.id, attempts );
	}

	/**
	 * Records an error that isn't tied to a test.
	 *
	 * For example, a spec that failed to load, or `maxFailures` being reached.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} error The Playwright error.
	 */
	onError( error ) {
		this.errors.push( formatError( error ) );
	}

	/**
	 * Writes the report.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} result The result of the whole run.
	 */
	onEnd( result ) {
		const entries = this.suite
			.allTests()
			.map( ( test ) => this.getEntry( test ) )
			.filter( Boolean );

		const summary = { total: entries.length };

		for ( const status of [
			'failed',
			'new',
			'flaky',
			'notRun',
			'passed',
		] ) {
			summary[ status ] = entries.filter(
				( entry ) => entry.status === status
			).length;
		}

		const data = {
			summary,
			run: {
				date: this.startTime.toISOString(),
				duration: result.duration,
				status: result.status,
				commit: process.env.GITHUB_SHA || null,
			},
			errors: this.errors,
			entries,
		};

		// Escape `<` so no string can close the `<script>` element.
		fs.writeFileSync(
			path.join( this.outputDir, 'data.js' ),
			`window.VRT_REPORT = ${ JSON.stringify( data ).replace(
				/</g,
				'\\u003c'
			) };\n`
		);
		fs.writeFileSync(
			path.join( this.outputDir, 'summary.json' ),
			`${ JSON.stringify( summary, null, '\t' ) }\n`
		);

		for ( const file of APP_FILES ) {
			fs.copyFileSync(
				path.join( APP_DIR, file ),
				path.join( this.outputDir, file )
			);
		}
	}

	/**
	 * Builds the report entry for a test.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} test The Playwright test case.
	 * @return {Object|null} The entry, or `null` for a test that isn't a story.
	 */
	getEntry( test ) {
		const annotation = test.annotations.find(
			( { type } ) => type === 'reference image'
		);

		if ( ! annotation ) {
			return null;
		}

		const viewport = test.parent.project().name;
		const attempts = this.attempts.get( test.id ) || [];
		// Show the first attempt that didn't pass: for a flaky test, that's the
		// failure. Tests that never ran have no attempts.
		const shownAttempt = attempts.find(
			( { status } ) => status !== 'passed'
		) ||
			attempts[ attempts.length - 1 ] || {
				errors: [],
				images: NO_IMAGES,
			};
		const { errors, images } = shownAttempt;
		const error = errors[ 0 ] || '';
		const status = getStatus( test, error );

		return {
			id: test.id,
			label: test.title,
			viewport,
			// Set with `--repeat-each`.
			repeat: test.repeatEachIndex,
			status,
			// A new story's file in `__screenshots__/` is the screenshot just
			// taken, not a reference image.
			reference:
				status === 'new'
					? null
					: this.copyReferenceImage(
							`${ annotation.description }/${ viewport }.png`
					  ),
			...images,
			summary: getSummary( status, error, images.actual ),
			errors,
			// Only a screenshot that differs from its reference image, or is new,
			// can be approved. A flaky test's screenshot matched it on retry.
			approveCommand:
				images.actual && status !== 'flaky'
					? getApproveCommand( test.title, viewport )
					: null,
		};
	}

	/**
	 * Copies a reference image into the report.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} file The image's path, relative to `__screenshots__/`.
	 * @return {Object|null} The image (see `writeImage()`), or `null` if there's
	 *                       no reference image.
	 */
	copyReferenceImage( file ) {
		const source = path.join( SCREENSHOTS_DIR, file );

		if ( ! fs.existsSync( source ) ) {
			return null;
		}

		return this.writeImage(
			fs.readFileSync( source ),
			`images/reference/${ file }`
		);
	}

	/**
	 * Copies an attached image into the report, named by its content.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} attachment A Playwright attachment, with a `path` or `body`.
	 * @return {Object|null} The image (see `writeImage()`), or `null` if it's
	 *                       missing.
	 */
	copyImage( attachment ) {
		let contents = attachment.body;

		if (
			! contents &&
			attachment.path &&
			fs.existsSync( attachment.path )
		) {
			contents = fs.readFileSync( attachment.path );
		}

		if ( ! contents ) {
			return null;
		}

		const hash = crypto
			.createHash( 'sha1' )
			.update( contents )
			.digest( 'hex' );

		return this.writeImage( contents, `images/results/${ hash }.png` );
	}

	/**
	 * Writes an image into the report.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Buffer} contents The image.
	 * @param {string} target   Its path in the report, with `/` separators.
	 * @return {Object} The image's `src` (its path in the report), and its
	 *                  `width` and `height`, so the page can lay it out before
	 *                  it loads.
	 */
	writeImage( contents, target ) {
		const file = path.join( this.outputDir, ...target.split( '/' ) );

		fs.mkdirSync( path.dirname( file ), { recursive: true } );
		fs.writeFileSync( file, contents );

		return { src: target, ...getPNGSize( contents ) };
	}
}

module.exports = VRTReporter;
