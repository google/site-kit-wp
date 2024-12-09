/**
 * FPM server requirement status test.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
	activatePlugins,
	deactivateUtilityPlugins,
	enableFeature,
	resetSiteKit,
	setupSiteKit,
	wpApiFetch,
} from '../../utils';

describe( 'FPM server requirement status', () => {
	beforeEach( async () => {
		await activatePlugins(
			'e2e-tests-fpm-server-requirement-status-plugin'
		);
		await setupSiteKit();
		await enableFeature( 'firstPartyMode' );
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'shows the correct status', async () => {
		const response = await wpApiFetch( {
			path: 'google-site-kit/v1/core/site/data/fpm-server-requirement-status',
			method: 'get',
		} );

		expect( response ).toEqual( {
			isEnabled: null,
			isFPMHealthy: true,
			isScriptAccessEnabled: true,
		} );
	} );
} );
