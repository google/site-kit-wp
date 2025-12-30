/**
 * Steps and screenshots helpers.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
 * Node dependencies
 */
import path from 'path';
import { mkdir, rm } from 'fs/promises';

const screenshotsIndex = new Map();

/**
 * Makes a screenshot of the current page.
 *
 * @since 1.27.0
 *
 * @param {string} name    Screenshot name.
 * @param {Object} options Screenshot objects.
 */
export async function screenshot( name, options = {} ) {
	const { resolve, join } = path;
	const { currentTestName, testPath } = expect.getState();

	const rootDir = resolve( __dirname, '..' );
	const testDir = testPath
		.replace( resolve( rootDir, 'specs' ), '' )
		.replace( '.test.js', '' );
	const screenshotsDir = join(
		rootDir,
		'screenshots',
		testDir,
		currentTestName.replace( /\W+/g, '-' )
	);

	const screenshotKey = testPath + currentTestName;
	const screenshotIndex = ( screenshotsIndex.get( screenshotKey ) || 0 ) + 1;

	screenshotsIndex.set( screenshotKey, screenshotIndex );

	await mkdir( screenshotsDir, {
		mode: 0o755,
		recursive: true,
	} );

	await page.screenshot( {
		path: `${ screenshotsDir }/${ screenshotIndex
			.toString()
			.padStart( 2, '0' ) }-${ name.replace( /\W+/, '-' ) }.png`,
		type: 'png',
		...options,
	} );
}

/**
 * Makes a step and takes a screenshot.
 *
 * @since 1.27.0
 *
 * @param {string}           name                   Step name.
 * @param {Function|Promise} cb                     Step callback function or a promise object.
 * @param {Object}           options                Step options.
 * @param {Object}           options.screenshotArgs Screenshot arguments.
 * @return {Promise} Promise object.
 */
export function step( name, cb, { screenshotArgs = {} } = {} ) {
	return new Promise( async ( resolve, reject ) => {
		try {
			const results = await ( typeof cb === 'function' ? cb() : cb );
			await screenshot( `pass-${ name }`, screenshotArgs );
			resolve( results );
		} catch ( err ) {
			await screenshot( `fail-${ name }`, screenshotArgs );
			reject( err );
		}
	} );
}

/**
 * Empties the screenshots directory.
 *
 * @since 1.89.0
 */
export async function clearScreenshots() {
	const { resolve, join } = path;
	const rootDir = resolve( __dirname, '..' );
	const screenshotsDir = join( rootDir, 'screenshots' );

	await rm( screenshotsDir, { recursive: true, force: true } );

	await mkdir( screenshotsDir );
}
