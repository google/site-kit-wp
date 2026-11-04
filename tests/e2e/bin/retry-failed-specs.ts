/**
 * Retries the spec files that failed in an E2E run.
 *
 * Reads the Jest JSON results of the run, then runs each failed spec file
 * once more. A spec file counts as failed when a test in it fails, and also
 * when only one of its hooks fails, which `--onlyFailures` does not rerun.
 * Writes the spec files that passed only on the retry to the GitHub job
 * summary.
 *
 * Usage: node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/e2e/bin/retry-failed-specs.ts <results-json-path>
 *
 * Node runs this file directly, without a build step. `tests/e2e` sets no
 * module type, so Node warns that it reparses the file as an ES module; the
 * flag turns off that one warning.
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
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

interface SpecFileResult {
	// Absolute path of the spec file.
	name: string;
	status: 'passed' | 'failed';
}

interface JestResults {
	numTotalTestSuites: number;
	testResults: SpecFileResult[];
}

// When more spec files than this fail, the environment is more likely broken
// than the tests flaky, so the failures are reported without a retry. This
// counts spec files, not the tests in them.
const MAX_SPEC_FILES_TO_RETRY = 3;

const E2E_DIRECTORY = resolve( dirname( process.argv[ 1 ] ), '..' );

/**
 * Reads the Jest JSON results at the given path.
 *
 * @since n.e.x.t
 *
 * @param resultsPath Path of the results file.
 * @return The results, or `null` when the file does not exist.
 */
function readResults( resultsPath: string ): JestResults | null {
	if ( ! existsSync( resultsPath ) ) {
		return null;
	}
	return JSON.parse( readFileSync( resultsPath, 'utf8' ) );
}

/**
 * Gets the spec files that failed in the given results.
 *
 * @since n.e.x.t
 *
 * @param results Jest JSON results.
 * @return Absolute paths of the failed spec files.
 */
function getFailedSpecFiles( results: JestResults ): string[] {
	return results.testResults
		.filter( ( { status } ) => status === 'failed' )
		.map( ( { name } ) => name );
}

/**
 * Runs the given spec files.
 *
 * @since n.e.x.t
 *
 * @param specFiles   Absolute paths of the spec files to run.
 * @param resultsPath Path to write the Jest JSON results to.
 * @return Absolute paths of the spec files that failed again.
 */
function runSpecFiles( specFiles: string[], resultsPath: string ): string[] {
	const { status } = spawnSync(
		'npm',
		[
			'run',
			'test',
			'--',
			'--runTestsByPath',
			'--json',
			`--outputFile=${ resultsPath }`,
			...specFiles,
		],
		{ cwd: E2E_DIRECTORY, stdio: 'inherit' }
	);

	const results = readResults( resultsPath );
	const failed = results ? getFailedSpecFiles( results ) : specFiles;

	// A failed run with no failed spec file did not finish, so none of the
	// spec files count as passed.
	return status !== 0 && failed.length === 0 ? specFiles : failed;
}

/**
 * Formats spec file paths as a Markdown list.
 *
 * @since n.e.x.t
 *
 * @param specFiles Absolute paths of the spec files.
 * @return One list item for each spec file, relative to `tests/e2e`.
 */
function toMarkdownList( specFiles: string[] ): string[] {
	return specFiles.map(
		( specFile ) => `- \`${ relative( E2E_DIRECTORY, specFile ) }\``
	);
}

/**
 * Prints the summary, and adds it to the GitHub job summary when it exists.
 *
 * @since n.e.x.t
 *
 * @param  lines Lines of the summary.
 * @return {void}
 */
function writeSummary( lines: string[] ) {
	const summary = `${ lines.join( '\n' ) }\n`;
	global.console.log( summary );
	if ( process.env.GITHUB_STEP_SUMMARY ) {
		appendFileSync( process.env.GITHUB_STEP_SUMMARY, summary );
	}
}

/**
 * Retries the failed spec files from the given results.
 *
 * @since n.e.x.t
 *
 * @param resultsPath Path of the Jest JSON results of the first run.
 * @return Exit code: `0` when every failed spec file passed on the retry.
 */
function main( resultsPath: string | undefined ): number {
	if ( ! resultsPath ) {
		global.console.error(
			'Usage: node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/e2e/bin/retry-failed-specs.ts <results-json-path>'
		);
		return 1;
	}

	const results = readResults( resultsPath );
	if ( ! results ) {
		global.console.error(
			`No E2E results at ${ resultsPath }. The run did not finish, so nothing is retried.`
		);
		return 1;
	}

	const failed = getFailedSpecFiles( results );
	if ( failed.length === 0 ) {
		global.console.error(
			'The E2E run failed, but no spec file failed, so nothing is retried.'
		);
		return 1;
	}
	if ( failed.length > MAX_SPEC_FILES_TO_RETRY ) {
		global.console.error(
			`${ failed.length } of ${ results.numTotalTestSuites } spec files failed, more than the ${ MAX_SPEC_FILES_TO_RETRY } that are retried, so nothing is retried.`
		);
		return 1;
	}

	global.console.log(
		`Retrying the failed spec files:\n${ toMarkdownList( failed ).join(
			'\n'
		) }`
	);
	const stillFailed = runSpecFiles(
		failed,
		resultsPath.replace( /\.json$/, '-retry.json' )
	);
	const flaky = failed.filter(
		( specFile ) => ! stillFailed.includes( specFile )
	);

	const lines = [ '### E2E retries', '' ];
	if ( flaky.length ) {
		lines.push(
			'⚠️ These spec files failed, then passed on the retry:',
			...toMarkdownList( flaky ),
			''
		);
		flaky.forEach( ( specFile ) => {
			global.console.log(
				`::warning title=Flaky E2E spec::${ relative(
					E2E_DIRECTORY,
					specFile
				) } failed, then passed on the retry.`
			);
		} );
	}
	if ( stillFailed.length ) {
		lines.push(
			'❌ These spec files failed again on the retry:',
			...toMarkdownList( stillFailed ),
			''
		);
	}
	writeSummary( lines );

	return stillFailed.length ? 1 : 0;
}

process.exitCode = main( process.argv[ 2 ] );
