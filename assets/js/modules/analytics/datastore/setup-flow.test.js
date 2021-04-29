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
import { STORE_NAME } from './constants';
import { createTestRegistry, unsubscribeFromAll } from 'tests/js/utils';
import * as modulesAnalytics from '../';
import { MODULES_ANALYTICS_4 } from '../../analytics-4/datastore/constants';
// import * as fixtures from './__fixtures__';
// TODO - should be in own section? check other test copied from
import { createRegistry } from '@wordpress/data';

const populateAnalytics4DataStore = ( registry ) => {
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
	{ accountID: 'foo-bar' },
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
		{ propertyID: 'foobar' }
	);
};

describe( 'modules/analytics properties', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		// Receive empty settings to prevent unexpected fetch by resolver.
		registry.dispatch( STORE_NAME ).receiveGetSettings( {} );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	// TODO - in describe block like other tests for selector getSetupFlowMode

	it( 'should be true', () => {
		expect( true ).toBe( true );
	} );

	it( 'returns “legacy” if the modules/analytics-4 store is not available ', async () => {
		// only register this module
		const newRegistry = createRegistry();

		[
			modulesAnalytics,
		].forEach( ( { registerStore } ) => registerStore?.( newRegistry ) );

		registry = newRegistry;
		// Receive empty settings to prevent unexpected fetch by resolver.
		registry.dispatch( STORE_NAME ).receiveGetSettings( {} );

		expect( registry.select( STORE_NAME ).getSetupFlowMode() ).toBe( 'legacy' );
	} );

	it( 'should return “legacy” if isAdminAPIWorking() returns false ', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveError(
			new Error( 'foo' ), 'getProperties', [ 'foo', 'bar' ]
		);

		expect( registry.select( STORE_NAME ).getSetupFlowMode() ).toBe( 'legacy' );
	} );

	it( 'should return undefined if isAdminAPIWorking() returns undefined ', () => {
		expect( registry.select( STORE_NAME ).getSetupFlowMode() ).toBe( undefined );
	} );

	it( 'should return “ua” if there is no account selected', () => {
		populateAnalytics4DataStore( registry );

		// console.debug( 'isAdminAPIWorking ', registry.select( MODULES_ANALYTICS_4 ).isAdminAPIWorking() );

		expect( registry.select( STORE_NAME ).getSetupFlowMode() ).toBe( 'ua' );
	} );

	it.todo( 'should return “ua” if selected account returns an empty array from GA4 getProperties selector' );

	it.todo( 'should return “ga4” if selected account returns an empty array from UA getProperties selector' );

	it.todo( 'should return “ga4-transitional” if both GA4 and UA getProperties return non-empty array' );
} );

