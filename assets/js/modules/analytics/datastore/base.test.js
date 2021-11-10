/**
 * `modules/analytics` base data store tests.
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
 * Internal dependencies
 */
import { createTestRegistry } from '../../../../../tests/js/utils';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS } from './constants';

describe( 'modules/analytics base data store', () => {
	let registry;
	let store;

	const adminURL = 'http://something.test/wp-admin';

	beforeEach( () => {
		jest.resetModules();

		registry = createTestRegistry();
		registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			adminURL,
		} );
	} );

	describe( 'when unified dashboard is enabled', () => {
		beforeEach( () => {
			const { enabledFeatures } = require( '../../../features' );
			enabledFeatures.add( 'unifiedDashboard' );

			store = require( './base' ).default;
			registry.registerStore( MODULES_ANALYTICS, store );
		} );

		it( 'does not define the admin page', () => {
			expect( store.selectors.getAdminScreenURL() ).toBe(
				`${ adminURL }/admin.php?page=googlesitekit-dashboard`
			);
		} );
	} );

	describe( 'when unified dashboard is not enabled', () => {
		beforeEach( () => {
			store = require( './base' ).default;
			registry.registerStore( MODULES_ANALYTICS, store );
		} );

		it( 'does define the admin page', () => {
			expect( store.selectors.getAdminScreenURL() ).toBe(
				`${ adminURL }/admin.php?page=googlesitekit-module-analytics`
			);
		} );
	} );
} );
