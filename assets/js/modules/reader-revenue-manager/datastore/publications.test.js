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
	ONBOARDING_STATE_COMPLETE,
	ONBOARDING_STATE_UNSPECIFIED,
	ONBOARDING_STATE_PENDING_VERIFICATION,
	UI_KEY_SHOW_RRM_PUBLICATION_APPROVED_NOTIFICATION,
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
					slug: 'reader-revenue-manager',
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

			it( 'should update the settings and call saveSettings', () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( fixtures.publications );

				const publication = fixtures.publications[ 0 ];

				const settings = {
					publicationID: publication.publicationId,
					publicationOnboardingState:
						ONBOARDING_STATE_PENDING_VERIFICATION,
					publicationOnboardingStateLastSyncedAtMs: 0,
				};

				fetchMock.post( settingsEndpoint, {
					body: {
						...settings,
						publicationOnboardingState:
							ONBOARDING_STATE_UNSPECIFIED,
					},
					status: 200,
				} );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( settings );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.syncPublicationOnboardingState();

				const updatedSettings = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getSettings();

				expect( fetchMock ).toHaveFetched( settingsEndpoint );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( updatedSettings.publicationID ).toBe( 'ABCDEFGH' );
				expect( updatedSettings.publicationOnboardingState ).toBe(
					'ONBOARDING_STATE_UNSPECIFIED'
				);
				expect(
					updatedSettings.publicationOnboardingStateLastSyncedAtMs
				).not.toBe( 0 );

				// Ensure that date is within the last 5 seconds.
				expect(
					updatedSettings.publicationOnboardingStateLastSyncedAtMs
				).toBeLessThanOrEqual( Date.now() );

				expect(
					updatedSettings.publicationOnboardingStateLastSyncedAtMs
				).toBeGreaterThan( Date.now() - 5000 );
			} );

			it( 'should set UI_KEY_SHOW_RRM_PUBLICATION_APPROVED_NOTIFICATION to true in CORE_UI store', () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( fixtures.publications );

				const publication = fixtures.publications[ 3 ];

				// Set the current settings.
				const settings = {
					publicationID: publication.publicationId,
					publicationOnboardingState: ONBOARDING_STATE_UNSPECIFIED,
					publicationOnboardingStateLastSyncedAtMs: 0,
				};

				fetchMock.post( settingsEndpoint, {
					body: {
						...settings,
						publicationOnboardingState: ONBOARDING_STATE_COMPLETE,
					},
					status: 200,
				} );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( settings );

				const uiKeyBeforeAction = registry
					.select( CORE_UI )
					.getValue(
						UI_KEY_SHOW_RRM_PUBLICATION_APPROVED_NOTIFICATION
					);

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.syncPublicationOnboardingState();

				const uiKeyAfterAction = registry
					.select( CORE_UI )
					.getValue(
						UI_KEY_SHOW_RRM_PUBLICATION_APPROVED_NOTIFICATION
					);

				expect( uiKeyBeforeAction ).toBe( undefined );
				expect( uiKeyAfterAction ).toBe( true );
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
