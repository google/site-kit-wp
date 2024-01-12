/**
 * `modules/analytics-4` data store: service tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
 *
 * Internal dependencies
 */
import { decodeServiceURL } from '../../../../../tests/js/mock-accountChooserURL-utils';
import {
	createTestRegistry,
	provideSiteInfo,
	provideUserInfo,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import {
	REPORT_ARGS_DATA_FILTERS_KEY,
	REPORT_ARGS_NAV_KEY,
	REPORT_ARGS_SELECTED_DIMENSION_KEY,
	REPORT_ARGS_SELECTED_METRIC_KEY,
} from '../constants';
import { MODULES_ANALYTICS_4 } from './constants';
import { MODULES_ANALYTICS } from '../../analytics/datastore/constants';

describe( 'module/analytics-4 service store', () => {
	const baseURI = 'https://analytics.google.com/analytics/web/';

	const userData = {
		id: 1,
		email: 'admin@example.com',
		name: 'admin',
		picture: 'https://path/to/image',
	};

	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserInfo( registry, userData );
		provideSiteInfo( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {} );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'selectors', () => {
		describe( 'getServiceURL', () => {
			it( 'retrieves the correct URL with no arguments', () => {
				const serviceURL = registry
					.select( MODULES_ANALYTICS_4 )
					.getServiceURL();

				expect( serviceURL ).toMatchInlineSnapshot(
					'"https://accounts.google.com/accountchooser?continue=https%3A%2F%2Fanalytics.google.com%2Fanalytics%2Fweb%2F&Email=admin%40example.com"'
				);
			} );

			it( 'adds the path parameter', () => {
				const serviceURLNoSlashes = registry
					.select( MODULES_ANALYTICS_4 )
					.getServiceURL( { path: 'test/path/to/deeplink' } );

				expect( serviceURLNoSlashes ).toMatchInlineSnapshot(
					'"https://accounts.google.com/accountchooser?continue=https%3A%2F%2Fanalytics.google.com%2Fanalytics%2Fweb%2F%23%2Ftest%2Fpath%2Fto%2Fdeeplink&Email=admin%40example.com"'
				);

				const serviceURLWithLeadingSlash = registry
					.select( MODULES_ANALYTICS_4 )
					.getServiceURL( { path: '/test/path/to/deeplink' } );

				expect( serviceURLWithLeadingSlash ).toMatchInlineSnapshot(
					'"https://accounts.google.com/accountchooser?continue=https%3A%2F%2Fanalytics.google.com%2Fanalytics%2Fweb%2F%23%2Ftest%2Fpath%2Fto%2Fdeeplink&Email=admin%40example.com"'
				);
			} );

			it( 'adds query args', () => {
				const path = '/test/path/to/deeplink';
				const query = {
					authuser: userData.email,
					param1: '1',
					param2: '2',
				};
				const serviceURL = registry
					.select( MODULES_ANALYTICS )
					.getServiceURL( { path, query } );
				const decodedServiceURL = decodeServiceURL( serviceURL );

				expect( decodedServiceURL.startsWith( baseURI ) ).toBe( true );
				expect( decodedServiceURL.endsWith( `#${ path }` ) ).toBe(
					true
				);
				expect( decodedServiceURL ).toMatchQueryParameters( query );
			} );
		} );
		describe( 'getServiceReportURL', () => {
			const type = 'test-type';

			it( 'requires a report type', () => {
				expect( () =>
					registry.select( MODULES_ANALYTICS_4 ).getServiceReportURL()
				).toThrow( 'type is required to get a service report URL.' );
			} );

			it( 'returns `undefined` when no propertyID is set', () => {
				expect(
					registry.select( MODULES_ANALYTICS_4 ).getPropertyID()
				).toBeFalsy();

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getServiceReportURL( type )
				).toBeUndefined();
			} );

			describe( 'with necessary account data', () => {
				const propertyID = '123456789';

				beforeEach( () => {
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setPropertyID( propertyID );
				} );

				it( 'returns a service URL for the given report type for the current property', () => {
					const reportServiceURL = registry
						.select( MODULES_ANALYTICS_4 )
						.getServiceReportURL( type );

					const decodedServiceURL =
						decodeServiceURL( reportServiceURL );
					const url = new URL( decodedServiceURL );

					expect( decodedServiceURL.startsWith( baseURI ) ).toBe(
						true
					);
					expect( url.hash ).toBe(
						`#/p${ propertyID }/reports/explorer?params=${ REPORT_ARGS_NAV_KEY }=maui&r=${ type }`
					);
				} );

				it( 'returns a service URL for the given report type including any extra report-specific arguments', () => {
					const reportArgs = {
						dates: {
							startDate: '2023-01-23',
							endDate: '2023-01-24',
							compareStartDate: '2023-02-12',
							compareEndDate: '2023-02-13',
						},
						details: {
							metric: 'totalUsers',
							dimension: 'country',
						},
						filters: {
							sessionSource: 'google',
							unifiedPagePathScreen: '/some-path',
						},
						otherArgs: {
							// eslint-disable-next-line sitekit/acronym-case
							collectionId: 'some-collection-id',
						},
					};
					const reportServiceURL = registry
						.select( MODULES_ANALYTICS_4 )
						.getServiceReportURL( type, reportArgs );

					const decodedServiceURL =
						decodeServiceURL( reportServiceURL );

					const url = new URL( decodedServiceURL );

					expect( decodedServiceURL.startsWith( baseURI ) ).toBe(
						true
					);

					expect( url.hash ).toMatch(
						new RegExp(
							`#/p${ propertyID }/reports/explorer\\?params=.*&r=${ type }&collectionId=some-collection-id`
						)
					);

					const matches = /params=(.*)&r=/.exec( url.hash );
					const embeddedParams = matches[ 1 ];

					const searchParams = new global.URLSearchParams(
						embeddedParams
					);

					expect( Object.fromEntries( searchParams ) ).toEqual( {
						[ REPORT_ARGS_NAV_KEY ]: 'maui',
						// Date args:
						'_u.date00': '20230123',
						'_u.date01': '20230124',
						'_u.date10': '20230212',
						'_u.date11': '20230213',
						// Detail args:
						[ REPORT_ARGS_SELECTED_METRIC_KEY ]: JSON.stringify( [
							'totalUsers',
						] ),
						[ REPORT_ARGS_SELECTED_DIMENSION_KEY ]: JSON.stringify(
							[ 'country' ]
						),
						// Filter args:
						[ REPORT_ARGS_DATA_FILTERS_KEY ]: JSON.stringify( [
							{
								type: 1,
								fieldName: 'sessionSource',
								evaluationType: 1,
								expressionList: [ 'google' ],
								complement: false,
								isCaseSensitive: true,
								expression: '',
							},
							{
								type: 1,
								fieldName: 'unifiedPagePathScreen',
								evaluationType: 1,
								expressionList: [ '/some-path' ],
								complement: false,
								isCaseSensitive: true,
								expression: '',
							},
						] ),
					} );
				} );
			} );
		} );

		describe( 'getServiceEntityAccessURL', () => {
			it( 'returns `undefined` when no accountID is set', () => {
				expect(
					registry.select( MODULES_ANALYTICS ).getAccountID()
				).toBeFalsy();

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getServiceEntityAccessURL()
				).toBeUndefined();
			} );

			it( 'returns `undefined` when no propertyID is set', () => {
				registry.dispatch( MODULES_ANALYTICS ).setAccountID( '12345' );
				expect(
					registry.select( MODULES_ANALYTICS_4 ).getPropertyID()
				).toBeFalsy();

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getServiceEntityAccessURL()
				).toBeUndefined();
			} );

			it( 'returns `undefined` when no webDataStreamID is set', () => {
				registry.dispatch( MODULES_ANALYTICS ).setAccountID( '12345' );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setPropertyID( '34567' );
				expect(
					registry.select( MODULES_ANALYTICS_4 ).getWebDataStreamID()
				).toBeFalsy();

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getServiceEntityAccessURL()
				).toBeUndefined();
			} );

			it( 'returns a service entity access URL for the current account, property, and webDataStream', () => {
				const [ accountID, propertyID, webDataStreamID ] = [
					'12345',
					'34567',
					'56789',
				];

				registry
					.dispatch( MODULES_ANALYTICS )
					.setAccountID( accountID );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setPropertyID( propertyID );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setWebDataStreamID( webDataStreamID );

				const reportServiceURL = registry
					.select( MODULES_ANALYTICS_4 )
					.getServiceEntityAccessURL();
				const decodedServiceURL = decodeServiceURL( reportServiceURL );
				const url = new URL( decodedServiceURL );

				expect( decodedServiceURL.startsWith( baseURI ) ).toBe( true );
				expect( url.hash ).toBe(
					`#/a${ accountID }p${ propertyID }/admin/streams/table/${ webDataStreamID }`
				);
			} );
		} );
	} );
} );
