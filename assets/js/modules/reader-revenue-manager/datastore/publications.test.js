/* eslint-disable sitekit/acronym-case */
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
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import {
	createTestRegistry,
	untilResolved,
	provideModules,
	provideUserInfo,
	provideModuleRegistrations,
} from '../../../../../tests/js/utils';
import * as fixtures from './__fixtures__';
import { enabledFeatures } from '../../../features';
import {
	MODULES_READER_REVENUE_MANAGER,
	READER_REVENUE_MANAGER_MODULE_SLUG,
	PUBLICATION_ONBOARDING_STATES,
} from './constants';

describe( 'modules/reader-revenue-manager publications', () => {
	let registry;

	const getModulesEndpoint = new RegExp(
		'^/google-site-kit/v1/core/modules/data/list'
	);

	const publicationsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/publications'
	);

	const settingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/settings'
	);

	const syncOnboardingStateEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/sync-publication-onboarding-state'
	);

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		enabledFeatures.add( 'rrmModule' ); // Enable RRM module to get its features.
		registry = createTestRegistry();
		provideUserInfo( registry );
	} );

	describe( 'actions', () => {
		beforeEach( () => {
			// Make sure the RRM module is active and connected.
			const extraData = [
				{
					slug: READER_REVENUE_MANAGER_MODULE_SLUG,
					active: true,
					connected: true,
				},
			];
			provideModules( registry, extraData );
			provideModuleRegistrations( registry, extraData );
		} );

		describe( 'syncPublicationOnboardingState', () => {
			it( 'should return undefined when no publication ID is present', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( fixtures.publications );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( {} );

				const syncStatus = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.syncPublicationOnboardingState();

				expect( syncStatus ).toEqual( {} );
			} );

			it( 'should update the settings and call the saveSettings endpoint', async () => {
				const originalDateNow = Date.now;

				// Mock the date to be an arbitrary time.
				const mockNow = new Date( '2020-01-01 12:30:00' ).getTime();
				Date.now = jest.fn( () => mockNow );

				const publication = fixtures.publications[ 0 ];

				const settings = {
					publicationID: publication.publicationId,
					publicationOnboardingState:
						PUBLICATION_ONBOARDING_STATES.PENDING_VERIFICATION,
					publicationOnboardingStateLastSyncedAtMs: 0,
				};

				fetchMock.postOnce( syncOnboardingStateEndpoint, {
					body: {
						publicationOnboardingState:
							PUBLICATION_ONBOARDING_STATES.ONBOARDING_ACTION_REQUIRED,
						publicationOnboardingStateLastSyncedAtMs: mockNow,
					},
					status: 200,
				} );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( settings );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.syncPublicationOnboardingState();

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				// Set expectations for publication ID.
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationID()
				).toEqual( 'ABCDEFGH' );

				// Set expectations for publication onboarding state.
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationOnboardingState()
				).toEqual(
					PUBLICATION_ONBOARDING_STATES.ONBOARDING_ACTION_REQUIRED
				);

				const syncTimeMs = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublicationOnboardingStateLastSyncedAtMs();

				// Restore Date.now method.
				Date.now = originalDateNow;

				// Ensure that the sync time is set.
				expect( syncTimeMs ).not.toBe( 0 );
				expect( syncTimeMs ).toBe( mockNow );
			} );
		} );

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

		describe( 'maybeSyncPublicationOnboardingState', () => {
			it( 'should not sync publication onboarding state when last sync was less than an hour ago', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( fixtures.publications );

				const publication = fixtures.publications[ 0 ];

				const lastSyncedMS = Date.now();

				const settings = {
					publicationID: publication.publicationId,
					publicationOnboardingState:
						PUBLICATION_ONBOARDING_STATES.PENDING_VERIFICATION,
					publicationOnboardingStateLastSyncedAtMs: lastSyncedMS,
				};

				fetchMock.postOnce( settingsEndpoint, {
					body: {
						...settings,
						publicationOnboardingState:
							PUBLICATION_ONBOARDING_STATES.UNSPECIFIED,
						publicationOnboardingStateLastSyncedAtMs: Date.now(),
					},
					status: 200,
				} );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( settings );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.maybeSyncPublicationOnboardingState();

				expect( fetchMock ).not.toHaveFetched( settingsEndpoint );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationOnboardingStateLastSyncedAtMs()
				).toBe( lastSyncedMS );
			} );

			it( 'should sync publication onboarding state when last sync was more than an hour ago', async () => {
				const publication = fixtures.publications[ 0 ];

				const lastSyncedMS = Date.now() - 1000 * 60 * 60 - 1;

				const settings = {
					publicationID: publication.publicationId,
					publicationOnboardingState:
						PUBLICATION_ONBOARDING_STATES.PENDING_VERIFICATION,
					publicationOnboardingStateLastSyncedAtMs: lastSyncedMS,
				};

				fetchMock.postOnce( syncOnboardingStateEndpoint, {
					body: {
						publicationOnboardingState:
							PUBLICATION_ONBOARDING_STATES.UNSPECIFIED,
						publicationOnboardingStateLastSyncedAtMs: Date.now(),
					},
					status: 200,
				} );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( settings );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.maybeSyncPublicationOnboardingState();

				expect( fetchMock ).toHaveFetched(
					syncOnboardingStateEndpoint
				);
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationOnboardingStateLastSyncedAtMs()
				).not.toBe( lastSyncedMS );
			} );

			it( 'should sync publication onboarding state when `publicationOnboardingStateLastSyncedAtMs` is 0', async () => {
				const publication = fixtures.publications[ 0 ];

				const settings = {
					publicationID: publication.publicationId,
					publicationOnboardingState:
						PUBLICATION_ONBOARDING_STATES.PENDING_VERIFICATION,
					publicationOnboardingStateLastSyncedAtMs: 0,
				};

				fetchMock.postOnce( syncOnboardingStateEndpoint, {
					body: {
						publicationOnboardingState:
							PUBLICATION_ONBOARDING_STATES.UNSPECIFIED,
						publicationOnboardingStateLastSyncedAtMs: Date.now(),
					},
					status: 200,
				} );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( settings );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.maybeSyncPublicationOnboardingState();

				expect( fetchMock ).toHaveFetched(
					syncOnboardingStateEndpoint
				);
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationOnboardingStateLastSyncedAtMs()
				).not.toBe( 0 );
			} );

			it( 'should not sync publication onboarding state if the publication ID in state is not the saved publication ID', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( fixtures.publications );

				const publication = fixtures.publications[ 0 ];

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( {
						publicationID: publication.publicationId,
						publicationOnboardingState: publication.onboardingState,
						publicationOnboardingStateLastSyncedAtMs: 0,
					} );

				// Set a different publication ID in state.
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.setPublicationID(
						fixtures.publications[ 1 ].publicationId
					);

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.maybeSyncPublicationOnboardingState();

				// Verify that the onboarding state was not updated in state.
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationOnboardingState()
				).toEqual( publication.onboardingState );

				// Verify that the timestamp was not updated.
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationOnboardingStateLastSyncedAtMs()
				).toEqual( 0 );

				// Verify that the saveSettings endpoint was not called.
				expect( fetchMock ).not.toHaveFetched( settingsEndpoint );
			} );
		} );

		describe( 'resetPublications', () => {
			it( 'should reset the publications data in the store', async () => {
				const response = fixtures.publications.slice( 0, 2 );
				fetchMock.getOnce( publicationsEndpoint, {
					body: response,
					status: 200,
				} );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( fixtures.publications );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( {} );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.resetPublications();

				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublications();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublications();

				expect( fetchMock ).toHaveFetched();

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublications()
				).toEqual( response );
			} );
		} );

		describe( 'selectPublication', () => {
			it( 'should throw an error if a publication object is not provided', () => {
				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.selectPublication()
				).toThrow( 'A valid publication object is required.' );
			} );

			it.each( [ 'publicationId', 'onboardingState' ] )(
				'should throw an error if the publication object does not contain %s',
				( key ) => {
					const publication = {
						publicationPredicates: {},
						verifiedDomains: [],
					};

					switch ( key ) {
						case 'publicationId':
							publication.onboardingState = '';
							break;
						case 'onboardingState':
							publication.publicationId = '';
							break;
					}

					expect( () =>
						registry
							.dispatch( MODULES_READER_REVENUE_MANAGER )
							.selectPublication( publication )
					).toThrow( `The publication object must contain ${ key }` );
				}
			);

			it( 'should set the given publication in state', () => {
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationID()
				).toBeUndefined();
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationOnboardingState()
				).toBeUndefined();
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationOnboardingStateLastSyncedAtMs()
				).toBeUndefined();

				const [ publicationId, onboardingState ] = [
					'publication-id',
					'onboarding-state',
				];

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.selectPublication( {
						publicationId,
						onboardingState,
					} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationID()
				).toEqual( publicationId );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationOnboardingState()
				).toEqual( onboardingState );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationOnboardingStateLastSyncedAtMs()
				).toBeGreaterThan( 0 );
			} );
		} );
	} );

	describe( 'selectors', () => {
		beforeEach( () => {
			provideModules( registry );
			provideModuleRegistrations( registry );
		} );

		describe( 'getPublications', () => {
			it( 'should use a resolver to make a network request', async () => {
				fetchMock.get( publicationsEndpoint, {
					body: fixtures.publications,
					status: 200,
				} );

				fetchMock.get( getModulesEndpoint, {
					body: undefined,
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
} );
