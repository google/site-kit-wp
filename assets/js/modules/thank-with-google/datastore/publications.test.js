/**
 * `modules/thank-with-google` datastore: publications tests.
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
 * Internal dependencies
 */
import {
	createTestRegistry,
	freezeFetch,
	unsubscribeFromAll,
	untilResolved,
} from '../../../../../tests/js/utils';
import { MODULES_THANK_WITH_GOOGLE } from './constants';

describe( 'modules/thank-with-google publications', () => {
	let registry;
	const publicationWithActiveState = [
		{
			// eslint-disable-next-line sitekit/acronym-case
			publicationId: 'TEST-PUBLICATION-ID',
			displayName: 'Test publication title',
			verifiedDomains: [ 'https://example.com' ],
			paymentOptions: {
				virtualGifts: true,
			},
			state: 'ACTIVE',
		},
	];

	const publicationWithoutState = [
		{
			// eslint-disable-next-line sitekit/acronym-case
			publicationId: 'test-publication-id-2',
			displayName: 'Test publication title',
			verifiedDomains: [ 'https://example.com' ],
			paymentOptions: {
				virtualGifts: true,
			},
		},
	];

	const publicationsWithoutIDAndState = [
		{
			displayName: 'Test publication title',
			verifiedDomains: [ 'https://example.com' ],
			paymentOptions: {
				virtualGifts: true,
			},
		},
		{
			displayName: 'Test publication another title',
			verifiedDomains: [ 'https://example.com' ],
			paymentOptions: {
				virtualGifts: true,
			},
		},
	];

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'selectors', () => {
		describe( 'getPublications', () => {
			it( 'uses a resolver to get all the publications when requested', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/thank-with-google\/data\/publications/,
					{ body: publicationWithActiveState, status: 200 }
				);

				// The publications will be `undefined` whilst loading.
				expect(
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.getPublications()
				).toBeUndefined();

				// Wait for loading to complete.
				await untilResolved(
					registry,
					MODULES_THANK_WITH_GOOGLE
				).getPublications();

				const publications = registry
					.select( MODULES_THANK_WITH_GOOGLE )
					.getPublications();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( publications ).toEqual( publicationWithActiveState );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/thank-with-google\/data\/publications/,
					{ body: response, status: 500 }
				);

				registry.select( MODULES_THANK_WITH_GOOGLE ).getPublications();

				await untilResolved(
					registry,
					MODULES_THANK_WITH_GOOGLE
				).getPublications();

				const publications = registry
					.select( MODULES_THANK_WITH_GOOGLE )
					.getPublications();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( publications ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );

			it( 'returns undefined if publications is not yet available', () => {
				freezeFetch(
					/^\/google-site-kit\/v1\/modules\/thank-with-google\/data\/publications/
				);

				expect(
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.getPublications()
				).toBeUndefined();
			} );

			it( 'does not make a network request if data is already in state', () => {
				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.receiveGetPublications( publicationWithActiveState );

				const publications = registry
					.select( MODULES_THANK_WITH_GOOGLE )
					.getPublications();

				expect( fetchMock ).not.toHaveFetched();
				expect( publications ).toEqual( publicationWithActiveState );
			} );
		} );

		describe( 'getCurrentPublication', () => {
			it( 'returns undefined if publications is not yet available', () => {
				freezeFetch(
					/^\/google-site-kit\/v1\/modules\/thank-with-google\/data\/publications/
				);

				expect(
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.getCurrentPublication()
				).toBeUndefined();
			} );

			it( 'returns null if there are no publications', async () => {
				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.receiveGetPublications( [] );

				expect(
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.getCurrentPublication()
				).toBeNull();
			} );

			it( 'returns the publication if that is the only one in the list', () => {
				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.receiveGetPublications( publicationWithActiveState );

				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.setPublicationID( null );

				const publication = registry
					.select( MODULES_THANK_WITH_GOOGLE )
					.getCurrentPublication();

				expect( publication ).toEqual(
					publicationWithActiveState[ 0 ]
				);
			} );

			it( 'returns the publication if the publicationID is set and the publication is in the list', () => {
				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.receiveGetPublications( [
						...publicationWithActiveState,
						...publicationWithoutState,
					] );

				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.setPublicationID( 'test-publication-id-2' );

				const publication = registry
					.select( MODULES_THANK_WITH_GOOGLE )
					.getCurrentPublication();

				expect( publication ).toEqual( publicationWithoutState[ 0 ] );
			} );

			it( 'returns the publication if the publicationID is not set and the state is set to ACTIVE', () => {
				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.receiveGetPublications( [
						...publicationWithoutState,
						...publicationWithActiveState,
					] );

				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.setPublicationID( null );

				const publication = registry
					.select( MODULES_THANK_WITH_GOOGLE )
					.getCurrentPublication();

				expect( publication ).toEqual(
					publicationWithActiveState[ 0 ]
				);
			} );

			it( 'returns the first publication from the list if the publicationID is not set and the state is not set to ACTIVE', () => {
				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.receiveGetPublications( publicationsWithoutIDAndState );

				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.setPublicationID( null );

				const publication = registry
					.select( MODULES_THANK_WITH_GOOGLE )
					.getCurrentPublication();

				expect( publication ).toEqual(
					publicationsWithoutIDAndState[ 0 ]
				);
			} );
		} );
	} );
} );
