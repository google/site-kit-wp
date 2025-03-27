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
 * Internal dependencies
 */
import {
	createTestRegistry,
	muteFetch,
	untilResolved,
	waitForDefaultTimeouts,
} from '../../../../../tests/js/utils';
import { MODULES_ANALYTICS_4 } from './constants';
import { availableAudiences as availableAudiencesFixture } from './__fixtures__';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';

describe( 'modules/analytics-4 audience settings', () => {
	let registry;

	const saveAudienceSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/save-audience-settings'
	);

	beforeEach( () => {
		registry = createTestRegistry();

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
			const availableAudiences = [
				{
					name: 'properties/123456789/audiences/0987654321',
					displayName: 'All visitors',
					description: 'All users',
					audienceType: 'DEFAULT_AUDIENCE',
					audienceSlug: 'all-users',
				},
			];

			const syncAvailableAudiences = new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/sync-audiences'
			);

			it( 'should not sync cached audiences when the availableAudiences setting is not undefined', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAvailableAudiences( availableAudiences );

				const audiences = registry
					.select( MODULES_ANALYTICS_4 )
					.getAvailableAudiences();

				expect( fetchMock ).toHaveFetchedTimes( 0 );
				expect( audiences ).toEqual( availableAudiences );
			} );

			it( 'should sync cached audiences when availableAudiences is null for authenticated user', async () => {
				muteFetch( syncAvailableAudiences );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAudienceSettings( {
						availableAudiences: null,
					} );

				registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
					configuredAudiences: [
						'properties/12345/audiences/1',
						'properties/12345/audiences/2',
					],
				} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getAvailableAudiences()
				).toBeNull();

				// Wait until the resolver has finished fetching the audiences.
				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getAvailableAudiences();

				await waitForDefaultTimeouts();

				expect( fetchMock ).toHaveFetched( syncAvailableAudiences );
			} );

			it( 'should use a resolver to make a network request if data is not available', async () => {
				fetchMock.postOnce( syncAvailableAudiences, {
					body: JSON.stringify( availableAudiencesFixture ),
					status: 200,
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAudienceSettings( {
						availableAudiences: null,
					} );

				registry.select( MODULES_ANALYTICS_4 ).getAvailableAudiences();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getAvailableAudiences();

				await waitForDefaultTimeouts();

				expect(
					fetchMock.calls( syncAvailableAudiences )
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
