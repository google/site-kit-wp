/**
 * Site Health integration tests.
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
 * External dependencies
 */
import { visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { setupSiteKit } from '../../utils';

describe( 'Site Health', () => {
	it( 'adds debug data to the info tab when Site Kit is active but not setup', async () => {
		await visitAdminPage( 'site-health.php', 'tab=debug' );

		await expect( page ).toMatchElement( '.health-check-accordion button', {
			text: /site kit by google/i,
		} );
	} );

	it( 'adds debug data to the info tab when Site Kit is setup', async () => {
		await setupSiteKit();

		await visitAdminPage( 'site-health.php', 'tab=debug' );

		await expect( page ).toClick( '.health-check-accordion button', {
			text: /site kit by google/i,
		} );

		await expect( page ).toMatchElement( 'td', {
			text: /Search Console: Shared Roles/i,
			timeout: 1500,
		} );
	} );
} );
