/**
 * `modules/analytics-4` data store: settings tests.
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
	createTestRegistry,
	provideUserAuthentication,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import { withActive } from '../../../googlesitekit/modules/datastore/__fixtures__';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { MODULES_ANALYTICS } from '../../analytics/datastore/constants';
import { MODULES_ANALYTICS_4, PROPERTY_CREATE } from './constants';
import {
	INVARIANT_INVALID_PROPERTY_SELECTION,
	INVARIANT_INVALID_WEBDATASTREAM_ID,
} from './settings';
import * as fixtures from './__fixtures__';

describe( 'modules/analytics-4 settings', () => {
	let registry;

	const error = {
		code: 'internal_error',
		message: 'Something wrong happened.',
		data: { status: 500 },
	};

	const settingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/settings'
	);
	const createPropertyEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/create-property'
	);
	const createWebDataStreamsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/create-webdatastream'
	);

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_MODULES ).receiveGetModules( withActive() );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'submitChanges', () => {
			beforeEach( () => {
				provideUserAuthentication( registry );

				registry.dispatch( MODULES_ANALYTICS ).setSettings( {
					accountID: fixtures.createProperty._accountID,
				} );
			} );

			it( 'should dispatch createProperty and createWebDataStream actions if the "set up a new property" option is chosen', async () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID: PROPERTY_CREATE,
				} );

				fetchMock.postOnce( createPropertyEndpoint, {
					body: fixtures.createProperty,
					status: 200,
				} );

				fetchMock.postOnce( createWebDataStreamsEndpoint, {
					body: fixtures.createWebDataStream,
					status: 200,
				} );

				fetchMock.postOnce( settingsEndpoint, ( url, opts ) => {
					const { data } = JSON.parse( opts.body );
					// Return the same settings passed to the API.
					return { body: data, status: 200 };
				} );

				const result = await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.submitChanges();
				expect( result.error ).toBeFalsy();

				expect( fetchMock ).toHaveFetched( createPropertyEndpoint, {
					body: {
						data: { accountID: fixtures.createProperty._accountID },
					},
				} );
				expect( fetchMock ).toHaveFetched(
					createWebDataStreamsEndpoint,
					{
						body: {
							data: { propertyID: fixtures.createProperty._id },
						},
					}
				);

				const propertyID = registry
					.select( MODULES_ANALYTICS_4 )
					.getPropertyID();
				expect( propertyID ).toBe( fixtures.createProperty._id );

				const webDataStreamID = registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreamID();
				expect( webDataStreamID ).toBe(
					fixtures.createWebDataStream._id
				);
			} );

			it( 'should handle an error if set while creating a property', async () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID: PROPERTY_CREATE,
				} );

				fetchMock.postOnce( createPropertyEndpoint, {
					body: error,
					status: 500,
				} );

				await registry.dispatch( MODULES_ANALYTICS_4 ).submitChanges();

				expect( fetchMock ).toHaveFetched( createPropertyEndpoint, {
					body: {
						data: { accountID: fixtures.createProperty._accountID },
					},
				} );
				expect( fetchMock ).not.toHaveFetched(
					createWebDataStreamsEndpoint
				);

				expect(
					registry.select( MODULES_ANALYTICS_4 ).getPropertyID()
				).toBe( PROPERTY_CREATE );
				// @TODO: uncomment the following line once GA4 API is stabilized
				// expect( registry.select( MODULES_ANALYTICS_4 ).getErrorForAction( 'submitChanges' ) ).toEqual( error );
				expect( console ).toHaveErrored();
			} );

			it( 'should dispatch createWebDataStream actions if webDataStreamID is invalid', async () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID: fixtures.createProperty._id,
					webDataStreamID: '',
				} );

				fetchMock.postOnce( createWebDataStreamsEndpoint, {
					body: fixtures.createWebDataStream,
					status: 200,
				} );

				fetchMock.postOnce( settingsEndpoint, ( url, opts ) => {
					const { data } = JSON.parse( opts.body );
					// Return the same settings passed to the API.
					return { body: data, status: 200 };
				} );

				const result = await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.submitChanges();
				expect( result.error ).toBeFalsy();

				expect( fetchMock ).toHaveFetched(
					createWebDataStreamsEndpoint,
					{
						body: {
							data: { propertyID: fixtures.createProperty._id },
						},
					}
				);

				const webDataStreamID = registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreamID();
				expect( webDataStreamID ).toBe(
					fixtures.createWebDataStream._id
				);
			} );

			it( 'should handle an error if set while creating a web data stream', async () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID: fixtures.createProperty._id,
					webDataStreamID: '',
				} );

				fetchMock.postOnce( createWebDataStreamsEndpoint, {
					body: error,
					status: 500,
				} );

				await registry.dispatch( MODULES_ANALYTICS_4 ).submitChanges();

				expect( fetchMock ).toHaveFetched(
					createWebDataStreamsEndpoint,
					{
						body: {
							data: { propertyID: fixtures.createProperty._id },
						},
					}
				);

				expect(
					registry.select( MODULES_ANALYTICS_4 ).getWebDataStreamID()
				).toBe( '' );
				// @TODO: uncomment the following line once GA4 API is stabilized
				// expect( registry.select( MODULES_ANALYTICS_4 ).getErrorForAction( 'submitChanges' ) ).toEqual( error );
				expect( console ).toHaveErrored();
			} );

			it( 'should dispatch saveSettings', async () => {
				const validSettings = {
					propertyID: fixtures.createProperty._id,
					webDataStreamID: fixtures.createWebDataStream._id,
				};

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setSettings( validSettings );

				fetchMock.postOnce( settingsEndpoint, {
					body: validSettings,
					status: 200,
				} );

				await registry.dispatch( MODULES_ANALYTICS_4 ).submitChanges();

				expect( fetchMock ).toHaveFetched( settingsEndpoint, {
					body: { data: validSettings },
				} );
				expect(
					registry.select( MODULES_ANALYTICS_4 ).haveSettingsChanged()
				).toBe( false );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'canSubmitChanges', () => {
			beforeEach( () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID: fixtures.createProperty._id,
					webDataStreamID: fixtures.createWebDataStream._id,
				} );
			} );

			it( 'should return TRUE when all settings are valid', () => {
				expect(
					registry.select( MODULES_ANALYTICS_4 ).canSubmitChanges()
				).toBe( true );
			} );

			it( 'should require a valid propertyID', () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( null );
				expect( () =>
					registry
						.select( MODULES_ANALYTICS_4 )
						.__dangerousCanSubmitChanges()
				).toThrow( INVARIANT_INVALID_PROPERTY_SELECTION );
			} );

			it( 'should require a valid webDataStreamID', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setWebDataStreamID( '' );
				expect( () =>
					registry
						.select( MODULES_ANALYTICS_4 )
						.__dangerousCanSubmitChanges()
				).toThrow( INVARIANT_INVALID_WEBDATASTREAM_ID );
			} );
		} );
	} );
} );
