/**
 * `modules/tagmanager` data store: existing-tag tests.
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
import { setUsingCache } from 'googlesitekit-api';
import { MODULES_TAGMANAGER } from './constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import {
	createTestRegistry,
	untilResolved,
} from '../../../../../tests/js/utils';
import * as factories from './__factories__';

describe( 'modules/tagmanager existing-tag', () => {
	let registry;
	const homeURL = 'http://example.com/';

	beforeAll( () => {
		setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_SITE ).receiveSiteInfo( { homeURL } );
	} );

	afterAll( () => {
		setUsingCache( true );
	} );

	describe( 'selectors', () => {
		describe( 'getExistingTag', () => {
			it( 'gets the correct tagmanager tag', async () => {
				const expectedTag = 'GTM-S1T3K1T';

				fetchMock.getOnce(
					{ query: { tagverify: '1' } },
					{
						body: factories.generateHTMLWithTag( expectedTag ),
						status: 200,
					}
				);

				registry.select( MODULES_TAGMANAGER ).getExistingTag();

				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getExistingTag();

				const existingTag = registry
					.select( MODULES_TAGMANAGER )
					.getExistingTag();
				expect( existingTag ).toEqual( expectedTag );
			} );

			it( 'does not make a network request if existingTag is present', async () => {
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetExistingTag( 'GTM-S1T3K1T' );

				const existingTag = registry
					.select( MODULES_TAGMANAGER )
					.getExistingTag();

				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getExistingTag();

				expect( existingTag ).toEqual( 'GTM-S1T3K1T' );
				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'does not make a network request if existingTag is null', async () => {
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetExistingTag( null );

				const existingTag = registry
					.select( MODULES_TAGMANAGER )
					.getExistingTag();

				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getExistingTag();

				expect( existingTag ).toEqual( null );
				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'receives null for the tag if the request fails', async () => {
				// This is a limitation of the current underlying `getExistingTag` function.
				const errorResponse = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.getOnce(
					{ query: { tagverify: '1' } },
					{ body: errorResponse, status: 500 }
				);

				registry.select( MODULES_TAGMANAGER ).getExistingTag();

				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getExistingTag();

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const existingTag = registry
					.select( MODULES_TAGMANAGER )
					.getExistingTag();
				expect( existingTag ).toEqual( null );
			} );
		} );
	} );
} );
