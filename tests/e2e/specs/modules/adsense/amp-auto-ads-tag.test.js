/**
 * AMP auto ad tag tests.
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
import {
	activatePlugin,
	createURL,
	deactivatePlugin,
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { setAMPMode, setupAdSense } from '../../../utils';

describe( 'AMP <amp-auto-ads> tag', () => {
	beforeAll( async () => {
		await setupAdSense();
		await activatePlugin( 'amp' );
		await activatePlugin( 'e2e-tests-apply-content-filters' );
	} );
	afterAll( async () => {
		await deactivatePlugin( 'amp' );
		await deactivatePlugin( 'e2e-tests-apply-content-filters' );
	} );

	it( 'is output in primary mode', async () => {
		await setAMPMode( 'primary' );
		await expect( createURL( '/hello-world' ) ).toHaveAMPAutoAdsTag();
	} );

	it( 'is output in secondary mode', async () => {
		await setAMPMode( 'secondary' );
		await expect(
			createURL( '/hello-world', 'amp' )
		).toHaveAMPAutoAdsTag();
	} );

	it( 'is not output in secondary mode in web context', async () => {
		await setAMPMode( 'secondary' );
		await expect( createURL( '/hello-world' ) ).not.toHaveAMPAutoAdsTag();
	} );
} );
