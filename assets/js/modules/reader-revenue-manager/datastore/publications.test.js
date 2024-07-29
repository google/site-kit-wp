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
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	MODULE_SLUG,
	PUBLICATION_ONBOARDING_STATES,
	UI_KEY_READER_REVENUE_MANAGER_SHOW_PUBLICATION_APPROVED_NOTIFICATION,
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
					slug: MODULE_SLUG,
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

				expect( syncStatus ).toBeUndefined();
			} );

			it( 'should update the settings and call the saveSettings endpoint', async () => {
				const originalDateNow = Date.now;

				// Mock the date to be an arbitrary time.
				const mockNow = new Date( '2020-01-01 12:30:00' ).getTime();
				Date.now = jest.fn( () => mockNow );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( fixtures.publications );

				const publication = fixtures.publications[ 0 ];

				const settings = {
					publicationID: publication.publicationId,
					publicationOnboardingState:
						PUBLICATION_ONBOARDING_STATES.PENDING_VERIFICATION,
					publicationOnboardingStateLastSyncedAtMs: 0,
				};

				fetchMock.postOnce( settingsEndpoint, {
					body: {
						...settings,
						publicationOnboardingState:
							PUBLICATION_ONBOARDING_STATES.UNSPECIFIED,
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

				// Set expectations for settings endpoint.
				expect( fetchMock ).toHaveFetched( settingsEndpoint );
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
				).toEqual( PUBLICATION_ONBOARDING_STATES.UNSPECIFIED );

				const syncTimeMs = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublicationOnboardingStateLastSyncedAtMs();

				// Restore Date.now method.
				Date.now = originalDateNow;

				// Ensure that the sync time is set.
				expect( syncTimeMs ).not.toBe( 0 );
				expect( syncTimeMs ).toBe( mockNow );
			} );

			it( 'should set UI_KEY_SHOW_RRM_PUBLICATION_APPROVED_NOTIFICATION to true in CORE_UI store', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( fixtures.publications );

				const publication = fixtures.publications[ 3 ];

				// Set the current settings.
				const settings = {
					publicationID: publication.publicationId,
					publicationOnboardingState:
						PUBLICATION_ONBOARDING_STATES.UNSPECIFIED,
					publicationOnboardingStateLastSyncedAtMs: 0,
				};

				fetchMock.postOnce( settingsEndpoint, {
					body: {
						...settings,
						publicationOnboardingState:
							PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
						publicationOnboardingStateLastSyncedAtMs: Date.now(), // This is set purely for illustrative purposes, the actual value will be calculated at the point of dispatch.
					},
					status: 200,
				} );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( settings );

				expect(
					registry
						.select( CORE_UI )
						.getValue(
							UI_KEY_READER_REVENUE_MANAGER_SHOW_PUBLICATION_APPROVED_NOTIFICATION
						)
				).toBeUndefined();

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.syncPublicationOnboardingState();

				// Ensure that the UI key is set to true.
				expect(
					registry
						.select( CORE_UI )
						.getValue(
							UI_KEY_READER_REVENUE_MANAGER_SHOW_PUBLICATION_APPROVED_NOTIFICATION
						)
				).toBe( true );
			} );

			it( 'should not set UI_KEY_SHOW_RRM_PUBLICATION_APPROVED_NOTIFICATION when publication status is already complete', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( fixtures.publications );

				const publication = fixtures.publications[ 3 ];

				// Set the current settings.
				const settings = {
					publicationID: publication.publicationId,
					publicationOnboardingState:
						PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
					publicationOnboardingStateLastSyncedAtMs: 0,
				};

				fetchMock.postOnce( settingsEndpoint, {
					body: settings,
					status: 200,
				} );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( settings );

				expect(
					registry
						.select( CORE_UI )
						.getValue(
							UI_KEY_READER_REVENUE_MANAGER_SHOW_PUBLICATION_APPROVED_NOTIFICATION
						)
				).toBeUndefined();

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.syncPublicationOnboardingState();

				// Ensure that the UI key is not set.
				expect(
					registry
						.select( CORE_UI )
						.getValue(
							UI_KEY_READER_REVENUE_MANAGER_SHOW_PUBLICATION_APPROVED_NOTIFICATION
						)
				).toBeUndefined();
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
