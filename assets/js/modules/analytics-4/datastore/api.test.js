/**
 * `modules/analytics-4` data store: api tests.
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

describe( 'modules/analytics-4 properties', () => {
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

	describe( 'selectors', () => {
		describe( 'isAdminAPIWorking', () => {
			test.each`
			property   | webData    | errorProperty | errorWebData | expected
			${ true }  | ${ true }  |  ${ false }   | ${ false }   | ${ true }
			${ true }  | ${ false } |  ${ false }   | ${ false }   | ${ true }
			${ false } | ${ true }  |  ${ false }   | ${ false }   | ${ undefined }
			${ false } | ${ false } |  ${ false }   | ${ false }   | ${ undefined }
			${ true }  | ${ true }  |  ${ true }    | ${ false }   | ${ false }
			${ true }  | ${ true }  |  ${ false }   | ${ true }    | ${ false }
			${ true }  | ${ true }  |  ${ true }    | ${ true }    | ${ false }
			${ false } | ${ true }  |  ${ true }    | ${ true }    | ${ false }
			${ true }  | ${ false } |  ${ true }    | ${ true }    | ${ false }
			${ false } | ${ false } |  ${ true }    | ${ true }    | ${ false }
			`( 'When has values for property:$property & webData:$webData, and has errors property:$errorProperty & webData:$errorWebData then expects: $expected',
				( { property, webData, errorProperty, errorWebData, expected } ) => {
					if ( property ) {
						registry.dispatch( STORE_NAME ).receiveGetProperties( [
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
					}
					if ( webData ) {
						registry.dispatch( STORE_NAME ).receiveGetWebDataStreams(
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
					}
					if ( errorProperty ) {
						registry.dispatch( STORE_NAME ).receiveError(
							new Error( 'foo' ), 'getProperties', [ 'foo', 'bar' ]
						);
					}
					if ( errorWebData ) {
						registry.dispatch( STORE_NAME ).receiveError(
							new Error( 'foo' ), 'getWebDataStreams', [ 'foo', 'bar' ]
						);
					}

					const isAdminAPIWorking = registry.select( STORE_NAME ).isAdminAPIWorking();

					expect( isAdminAPIWorking ).toBe( expected );
				} );
		} );
	} );
} );
