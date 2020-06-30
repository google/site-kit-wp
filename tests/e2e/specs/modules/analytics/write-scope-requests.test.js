/**
 * Analytics write scope requests tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
 * Internal dependencies
 */
import {
	deactivateUtilityPlugins,
	resetSiteKit,
	setSiteVerification,
	setSearchConsoleProperty,
	setupAnalytics,
	useRequestInterception,
} from '../../../utils';

describe( 'Analytics write scope requests', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			if ( request.url().match( 'google-site-kit/v1/data/' ) ) {
				request.respond( {
					status: 200,
					body: JSON.stringify( mockBatchResponse ),
				} );
			} else {
				request.continue();
			}
		} );
	} );

	beforeEach( async () => {
		await activatePlugin( 'e2e-tests-oauth-callback-plugin' )
		await setSiteVerification();
		await setSearchConsoleProperty();
		await setupAnalytics();
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );
} );
