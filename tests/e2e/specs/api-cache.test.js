/**
 * API caching functions tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
 * WordPress dependencies
 */
import { visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	resetSiteKit,
	safeLoginUser,
	setupSiteKit,
	useRequestInterception,
} from '../utils';
import { deleteAuthCookie } from '../utils/delete-auth-cookie';

async function goToWordPressDashboard() {
	await visitAdminPage( 'index.php' );
}

async function googleSiteKitAPIgetTime( options ) {
	await page.waitForFunction(
		() =>
			window.googlesitekit !== undefined &&
			window.googlesitekit.api !== undefined
	);

	return await page.evaluate(
		( d, o ) => {
			return window.googlesitekit.api.get( 'e2e', 'util', 'time', d, o );
		},
		null, // data/params
		options
	);
}

describe( 'API cache', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			const url = request.url();
			if ( url.match( 'search-console/data/searchanalytics' ) ) {
				request.respond( { status: 200, body: '[]' } );
			} else {
				request.continue();
			}
		} );

		await setupSiteKit();
	} );

	afterAll( async () => {
		await resetSiteKit();
	} );

	it( 'isolates client storage between sessions', async () => {
		await goToWordPressDashboard();

		const initialTimeData = await googleSiteKitAPIgetTime();
		expect( initialTimeData ).toMatchObject( {
			time: expect.any( Number ),
		} );

		// Show that the data is cached when fetching again.
		const timeData = await googleSiteKitAPIgetTime();
		expect( timeData ).toEqual( initialTimeData );

		// delete auth cookie to sign out the current user
		await deleteAuthCookie();

		await safeLoginUser( 'admin', 'password' );

		await goToWordPressDashboard();

		const newTimeData = await googleSiteKitAPIgetTime();
		expect( initialTimeData ).toMatchObject( {
			time: expect.any( Number ),
		} );
		expect( newTimeData.time ).toBeGreaterThan( initialTimeData.time );
	} );
} );
