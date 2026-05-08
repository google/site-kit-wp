/**
 * `modules/reader-revenue-manager` base data store tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
	createTestRegistry,
	provideSiteInfo,
} from '../../../../../tests/js/utils';
import { MODULES_READER_REVENUE_MANAGER } from './constants';

describe( 'modules/reader-revenue-manager base data store', () => {
	let registry;
	let store;

	beforeEach( () => {
		jest.resetModules();

		registry = createTestRegistry();
		provideSiteInfo( registry );
	} );

	it( 'does not define the admin page', () => {
		store = require( './base' ).default;
		registry.registerStore( MODULES_READER_REVENUE_MANAGER, store );

		expect(
			registry
				.select( MODULES_READER_REVENUE_MANAGER )
				.getAdminScreenURL()
		).toBe(
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard'
		);
	} );
} );
