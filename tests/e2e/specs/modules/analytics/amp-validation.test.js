/**
 * Homepage AMP validation with Analytics enabled e2e tests.
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
 * WordPress dependencies
 */
import { deactivatePlugin } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	activateAMPWithMode,
	setupAnalytics4,
	setupSiteKit,
	resetSiteKit,
} from '../../../utils';

describe( 'AMP homepage validates with Analytics enabled', () => {
	beforeEach( async () => {
		await setupSiteKit();
		await activateAMPWithMode( 'primary' );
		await setupAnalytics4();
	} );
	afterEach( async () => {
		await deactivatePlugin( 'amp' );
		await resetSiteKit();
	} );
	it( 'validates for logged-in users', async () => {
		await expect( '/' ).toHaveValidAMPForUser();
	} );
	it( 'validates for non-logged-in users', async () => {
		await expect( '/' ).toHaveValidAMPForVisitor();
	} );
} );
