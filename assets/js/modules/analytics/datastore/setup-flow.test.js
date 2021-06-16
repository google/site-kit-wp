/**
 * `modules/analytics` data store: setup-flow tests.
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
import {
	MODULES_ANALYTICS,
	SETUP_FLOW_MODE_LEGACY,
	SETUP_FLOW_MODE_UA,
	SETUP_FLOW_MODE_GA4,
	SETUP_FLOW_MODE_GA4_TRANSITIONAL,
} from './constants';
import { createTestRegistry, unsubscribeFromAll } from 'tests/js/utils';
import { MODULES_ANALYTICS_4 } from '../../analytics-4/datastore/constants';
import { enabledFeatures } from '../../../features';

const accountID = 'pub-12345678';

const populateAnalyticsDatastore = ( registry ) => {
	registry.dispatch( MODULES_ANALYTICS ).receiveGetProperties(
		[
			{
				// eslint-disable-next-line sitekit/acronym-case
				accountId: accountID,
				id: 'UA-151753095-1',
				name: 'rwh',
			},
			{
				// eslint-disable-next-line sitekit/acronym-case
				accountId: accountID,
				id: 'UA-151753095-1',
				name: 'troubled-tipped.example.com',
			},
		],
		{ accountID }
	);
};

const populateAnalytics4Datastore = ( registry ) => {
	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties( [
		{
			_id: '1000',
			_accountID: '100',
			name: 'properties/1000',
			createTime: '2014-10-02T15:01:23Z',
			updateTime: '2014-10-02T15:01:23Z',
			parent: 'accounts/100',
			displayName: 'Test GA4 Property',
			industryCategory: 'TECHNOLOGY',
			timeZone: 'America/Los_Angeles',
			currencyCode: 'USD',
			deleted: false,
		},
	],
	{ accountID },
	);
	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetWebDataStreams(
		[
			{
				_id: '2000',
				_propertyID: '1000',
				name: 'properties/1000/webDataStreams/2000',
				// eslint-disable-next-line sitekit/acronym-case
				measurementId: '1A2BCD345E',
				// eslint-disable-next-line sitekit/acronym-case
				firebaseAppId: '',
				createTime: '2014-10-02T15:01:23Z',
				updateTime: '2014-10-02T15:01:23Z',
				defaultUri: 'http://example.com',
				displayName: 'Test GA4 WebDataStream',
			},
		],
		{ propertyID: '12345' }
	);
};

describe( 'modules/analytics setup-flow', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		// Receive empty settings to prevent unexpected fetch by resolver.
		registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {} );

		enabledFeatures.add( 'ga4setup' );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'selectors', () => {
		describe( 'getSetupFlowMode', () => {
			it( 'returns "legacy" if the feature flag ga4setup is disabled ', async () => {
				enabledFeatures.delete( 'ga4setup' );

				expect( registry.select( MODULES_ANALYTICS ).getSetupFlowMode() ).toBe( SETUP_FLOW_MODE_LEGACY );
			} );

			it( 'should return "legacy" if isAdminAPIWorking() returns false', () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveError(
					new Error( 'foo' ), 'getProperties', [ 'foo', 'bar' ]
				);

				expect( registry.select( MODULES_ANALYTICS_4 ).isAdminAPIWorking() ).toBe( false );
				expect( registry.select( MODULES_ANALYTICS ).getSetupFlowMode() ).toBe( SETUP_FLOW_MODE_LEGACY );
			} );

			it( 'should not return undefined if isAdminAPIWorking() returns undefined ', () => {
				expect( registry.select( MODULES_ANALYTICS_4 ).isAdminAPIWorking() ).toBeUndefined();
				expect( registry.select( MODULES_ANALYTICS ).getSetupFlowMode() ).not.toBeUndefined();
			} );

			it( 'should return undefined if settings are still loading', () => {
				fetchMock.get(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/settings/,
					{
						body: {
							accountID: 'pub-12345678',
							clientID: 'ca-pub-12345678',
							useSnippet: true,
						},
						status: 200,
					}
				);

				registry = createTestRegistry();
				populateAnalytics4Datastore( registry );

				expect( registry.select( MODULES_ANALYTICS_4 ).isAdminAPIWorking() ).toBe( true );
				expect( registry.select( MODULES_ANALYTICS ).getSettings() ).toBeUndefined();
				expect( registry.select( MODULES_ANALYTICS ).getSetupFlowMode() ).toBeUndefined();
			} );

			it( 'should return "ua" if there is no account selected', () => {
				expect( registry.select( MODULES_ANALYTICS ).getAccountID( accountID ) ).toBeUndefined();

				populateAnalytics4Datastore( registry );

				expect( registry.select( MODULES_ANALYTICS_4 ).isAdminAPIWorking() ).toBe( true );
				expect( registry.select( MODULES_ANALYTICS ).getSetupFlowMode() ).toBe( SETUP_FLOW_MODE_UA );
			} );

			it( 'should return undefined if selected account returns undefined from GA4 getProperties selector', () => {
				registry.dispatch( MODULES_ANALYTICS ).setAccountID( accountID );
				populateAnalyticsDatastore( registry );

				expect( registry.select( MODULES_ANALYTICS ).getProperties() ).toBeUndefined();
				expect( registry.select( MODULES_ANALYTICS ).getSetupFlowMode() ).toBeUndefined();
			} );

			it( 'should return "ua" if selected account returns an empty array from GA4 getProperties selector', () => {
				registry.dispatch( MODULES_ANALYTICS ).setAccountID( accountID );
				populateAnalyticsDatastore( registry );

				// For isAdminAPIWorking() to return true:
				// "The state['properties'] object has at least one account with a non-empty array of properties;"
				// See: https://github.com/google/site-kit-wp/issues/3169
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties( [
					{
						_id: '1000',
						_accountID: '100',
						name: 'properties/1000',
						createTime: '2014-10-02T15:01:23Z',
						updateTime: '2014-10-02T15:01:23Z',
						parent: 'accounts/100',
						displayName: 'Test GA4 Property',
						industryCategory: 'TECHNOLOGY',
						timeZone: 'America/Los_Angeles',
						currencyCode: 'USD',
						deleted: false,
					},
				],
				// This is a different accountID
				{ accountID: 'bar-1234567' },
				);

				//  Receive empty properties list to prevent unexpected fetch by resolver.
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties(
					[],
					{ accountID },
				);
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetWebDataStreams(
					[
						{
							_id: '2000',
							_propertyID: '1000',
							name: 'properties/1000/webDataStreams/2000',
							// eslint-disable-next-line sitekit/acronym-case
							measurementId: '1A2BCD345E',
							// eslint-disable-next-line sitekit/acronym-case
							firebaseAppId: '',
							createTime: '2014-10-02T15:01:23Z',
							updateTime: '2014-10-02T15:01:23Z',
							defaultUri: 'http://example.com',
							displayName: 'Test GA4 WebDataStream',
						},
					],
					{ propertyID: '12345' }
				);

				expect( registry.select( MODULES_ANALYTICS_4 ).isAdminAPIWorking() ).toBe( true );
				expect( registry.select( MODULES_ANALYTICS ).getSetupFlowMode() ).toBe( SETUP_FLOW_MODE_UA );
			} );

			it( 'should return undefined if selected account returns undefined from UA getProperties selector', () => {
				registry.dispatch( MODULES_ANALYTICS ).setAccountID( accountID );

				populateAnalytics4Datastore( registry );

				expect( registry.select( MODULES_ANALYTICS_4 ).isAdminAPIWorking() ).toBe( true );
				expect( registry.select( MODULES_ANALYTICS ).getSetupFlowMode() ).toBeUndefined();
			} );

			it( 'should return "ga4" if selected account returns an empty array from UA getProperties selector', () => {
				registry.dispatch( MODULES_ANALYTICS ).setAccountID( accountID );
				populateAnalytics4Datastore( registry );

				registry.dispatch( MODULES_ANALYTICS ).receiveGetProperties(
					[],
					{ accountID },
				);

				expect( registry.select( MODULES_ANALYTICS_4 ).isAdminAPIWorking() ).toBe( true );
				expect( registry.select( MODULES_ANALYTICS ).getSetupFlowMode() ).toBe( SETUP_FLOW_MODE_GA4 );
			} );

			it( 'should return "ga4-transitional" if both GA4 and UA properties are found for an account', () => {
				registry.dispatch( MODULES_ANALYTICS ).setAccountID( accountID );
				populateAnalytics4Datastore( registry );
				populateAnalyticsDatastore( registry );

				expect( registry.select( MODULES_ANALYTICS_4 ).isAdminAPIWorking() ).toBe( true );
				expect( registry.select( MODULES_ANALYTICS ).getSetupFlowMode() ).toBe( SETUP_FLOW_MODE_GA4_TRANSITIONAL );
			} );
		} );
	} );
} );
