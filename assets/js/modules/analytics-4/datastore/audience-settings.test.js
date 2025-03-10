/**
 * `modules/analytics-4` data store: audience settings tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	untilResolved,
	waitForDefaultTimeouts,
} from '../../../../../tests/js/utils';
import { MODULES_ANALYTICS_4 } from './constants';
import { availableAudiences as availableAudiencesFixture } from './__fixtures__';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';

/**
 * TODO: After the implementation of #8888, we can remove these individual imports
 * and directly use createTestRegistry from 'tests/js/utils' so that all the stores
 * are registered without the duplicate registration issue.
 */
import audienceSettingsStore from './audience-settings';
import audiencesStore from './audiences';
import userAudienceSettingsStore from '../../../googlesitekit/datastore/user/audience-settings';
import authenticationStore from '../../../googlesitekit/datastore/user/authentication';
import { combineStores, commonStore } from 'googlesitekit-data';

describe( 'modules/analytics-4 audience settings', () => {
	let registry;

	const saveAudienceSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/save-audience-settings'
	);

	const syncAvailableAudiencesEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/sync-audiences'
	);

	beforeEach( () => {
		// TODO: After #8888 is implemented, we can directly use `createTestRegistry` from 'tests/js/utils',
		// rather than registering the stores below.
		registry = createRegistry();

		registry.registerStore(
			MODULES_ANALYTICS_4,
			combineStores( audienceSettingsStore, commonStore, {
				audiencesStore,
				resolvers: {},
				actions: {
					// Provide a minimal implementation of `syncAvailableAudiences` for testing.
					*syncAvailableAudiences() {
						return registry
							.dispatch( MODULES_ANALYTICS_4 )
							.fetchSyncAvailableAudiences();
					},
				},
			} )
		);

		registry.registerStore(
			CORE_USER,
			combineStores(
				authenticationStore,
				commonStore,
				userAudienceSettingsStore
			)
		);

		registry.dispatch( CORE_USER ).receiveGetAuthentication( {
			authenticated: true,
		} );
	} );

	describe( 'actions', () => {
		describe( 'setAvailableAudiences', () => {
			it( 'should set availableAudiences', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAvailableAudiences( availableAudiencesFixture );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getAvailableAudiences()
				).toEqual( availableAudiencesFixture );
			} );

			it( 'should validate availableAudiences', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setAvailableAudiences( 'invalid' )
				).toThrow( 'Available audiences should be an array.' );
			} );
		} );

		describe( 'setAudienceSegmentationSetupCompletedBy', () => {
			it( 'should set setAudienceSegmentationSetupCompletedBy', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAudienceSegmentationSetupCompletedBy( 1 );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getAudienceSegmentationSetupCompletedBy()
				).toEqual( 1 );
			} );

			it( 'should validate setAudienceSegmentationSetupCompletedBy', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setAudienceSegmentationSetupCompletedBy( 'invalid' )
				).toThrow(
					'audienceSegmentationSetupCompletedBy by should be an integer.'
				);
			} );
		} );

		describe( 'saveAudienceSettings', () => {
			it( 'should save audience settings', async () => {
				const settings = {
					availableAudiences: availableAudiencesFixture,
					audienceSegmentationSetupCompletedBy: 1,
				};

				fetchMock.post( saveAudienceSettingsEndpoint, {
					body: settings,
					status: 200,
				} );

				const { response, error } = await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.saveAudienceSettings( settings );

				expect( response ).toEqual( settings );
				expect( error ).toBeUndefined();
			} );

			it( 'requires availableAudiences to be an array', () => {
				const settings = {
					availableAudiences: 'invalid',
					audienceSegmentationSetupCompletedBy: 1,
				};

				expect( () =>
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.saveAudienceSettings( settings )
				).toThrow( 'availableAudiences should be an array.' );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getAvailableAudiences', () => {
			it( 'should not make a network request if audience settings exist', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAvailableAudiences( availableAudiencesFixture );

				const availableAudiences = registry
					.select( MODULES_ANALYTICS_4 )
					.getAvailableAudiences();

				expect( availableAudiences ).toEqual(
					availableAudiencesFixture
				);

				expect(
					fetchMock.calls( syncAvailableAudiencesEndpoint )
				).toHaveLength( 0 );
			} );

			it( 'should use a resolver to make a network request if data is not available', async () => {
				fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
					body: availableAudiencesFixture,
					status: 200,
				} );

				registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
					configuredAudiences: [
						'properties/12345/audiences/1',
						'properties/12345/audiences/2',
					],
					availableAudiences: availableAudiencesFixture,
					audienceSegmentationSetupCompletedBy: 1,
				} );

				registry.select( MODULES_ANALYTICS_4 ).getAvailableAudiences();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getAvailableAudiences();

				await waitForDefaultTimeouts();

				expect(
					fetchMock.calls( syncAvailableAudiencesEndpoint )
				).toHaveLength( 1 );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getAvailableAudiences()
				).toEqual( availableAudiencesFixture );
			} );
		} );

		describe( 'getAudienceSegmentationSetupCompletedBy', () => {
			it( 'should return getAudienceSegmentationSetupCompletedBy', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAudienceSegmentationSetupCompletedBy( 1 );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getAudienceSegmentationSetupCompletedBy()
				).toEqual( 1 );
			} );
			it( 'should return undefined if getAudienceSegmentationSetupCompletedBy is not loaded', () => {
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getAudienceSegmentationSetupCompletedBy()
				).toBeUndefined();
			} );
			it( 'should throw an error if getAudienceSegmentationSetupCompletedBy is not an integer', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setAudienceSegmentationSetupCompletedBy( 'invalid' )
				).toThrow(
					'audienceSegmentationSetupCompletedBy by should be an integer.'
				);
			} );
		} );
	} );
} );
