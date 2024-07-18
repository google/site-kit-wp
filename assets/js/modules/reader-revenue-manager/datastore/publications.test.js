/**
 * `modules/reader-revenue-manager` data store: publications tests.
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
import API from 'googlesitekit-api';
import {
	createTestRegistry,
	untilResolved,
} from '../../../../../tests/js/utils';
import * as fixtures from './__fixtures__';
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_ONBOARDING_STATES,
} from './constants';

describe( 'modules/reader-revenue-manager publications', () => {
	let registry;

	const publicationsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/publications'
	);

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'selectors', () => {
		describe( 'getPublications', () => {
			it( 'should use a resolver to make a network request', async () => {
				fetchMock.get( publicationsEndpoint, {
					body: fixtures.publications,
					status: 200,
				} );

				const initialPublications = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublications();
				expect( initialPublications ).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublications();
				expect( fetchMock ).toHaveFetched( publicationsEndpoint );

				const publications = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublications();
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( publications ).toEqual( fixtures.publications );
				expect( publications ).toHaveLength(
					fixtures.publications.length
				);
			} );

			it( 'should not make a network request if publications are already present', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( fixtures.publications );

				const publications = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublications();
				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublications();

				expect( fetchMock ).not.toHaveFetched( publicationsEndpoint );
				expect( publications ).toEqual( fixtures.publications );
				expect( publications ).toHaveLength(
					fixtures.publications.length
				);
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( publicationsEndpoint, {
					body: response,
					status: 500,
				} );

				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublications();
				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublications();
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const publications = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublications();
				expect( publications ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );
		} );
	} );

	describe( 'actions', () => {
		describe( 'findMatchedPublication', () => {
			it( 'should return null if there are no publications', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( [] );

				const publication = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.findMatchedPublication();

				expect( publication ).toBeNull();
			} );

			it( 'should return the publication if that is the only one in the list', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( [ fixtures.publications[ 0 ] ] );

				const publication = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.findMatchedPublication();

				expect( publication ).toEqual( fixtures.publications[ 0 ] );
			} );

			it( 'should return the publication with ONBOARDING_COMPLETE if more than one publication exists', async () => {
				const completedOnboardingPublication =
					fixtures.publications.find(
						( publication ) =>
							publication.onboardingState ===
							PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE
					);

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( fixtures.publications );

				const publication = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.findMatchedPublication();

				expect( publication ).toEqual( completedOnboardingPublication );
			} );

			it( 'should return the first publication if none have ONBOARDING_COMPLETE', async () => {
				const publications = fixtures.publications.map(
					( publication ) => ( {
						...publication,
						onboardingState:
							PUBLICATION_ONBOARDING_STATES.PENDING_VERIFICATION,
					} )
				);

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( publications );

				const publication = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.findMatchedPublication();

				expect( publication ).toEqual( publications[ 0 ] );
			} );
		} );
	} );
} );
