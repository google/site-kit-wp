/**
 * `modules/analytics-4` data store: tags tests.
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
import API from 'googlesitekit-api';
import { STORE_NAME } from './constants';
import { createTestRegistry, unsubscribeFromAll, untilResolved, provideSiteInfo } from '../../../../../tests/js/utils';
import * as fixtures from './__fixtures__';
import * as factories from './__factories__';

describe( 'modules/analytics tags', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'selectors', () => {
		describe( 'getExistingTag', () => {
			it( 'gets the correct analytics tag', async () => {
				const expectedTag = fixtures.webDataStreams[ 0 ].measurementId; // eslint-disable-line sitekit/acronym-case
				const body = factories.generateHTMLWithTag( expectedTag );

				fetchMock.getOnce( { query: { tagverify: '1' } }, { body } );

				registry.select( STORE_NAME ).getExistingTag();
				await untilResolved( registry, STORE_NAME ).getExistingTag();

				const existingTag = registry.select( STORE_NAME ).getExistingTag();
				expect( existingTag ).toEqual( expectedTag );
			} );
		} );
	} );
} );
