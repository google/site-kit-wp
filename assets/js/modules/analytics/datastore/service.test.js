/**
 * `modules/analytics` data store: service tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import {
	createTestRegistry,
	provideUserInfo,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import * as fixtures from './__fixtures__';
import { STORE_NAME } from './constants';

describe( 'module/analytics service store', () => {
	const userData = {
		id: 1,
		email: 'admin@example.com',
		name: 'admin',
		picture: 'https://path/to/image',
	};
	const baseURI = 'https://analytics.google.com/analytics/web/';

	let registry;

	beforeAll( () => {
		registry = createTestRegistry();
		provideUserInfo( registry, userData );
		registry.dispatch( STORE_NAME ).receiveGetSettings( fixtures.settings.default );
	} );

	afterAll( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'selectors', () => {
		describe( 'getServiceURL', () => {
			it( 'retrieves the correct URL with no arguments', async () => {
				const serviceURL = registry.select( STORE_NAME ).getServiceURL();
				expect( serviceURL ).toBe( `${ baseURI }?authuser=${ encodeURIComponent( userData.email ) }` );
			} );

			it( 'adds the path parameter', () => {
				const expectedURL = `${ baseURI }?authuser=${ encodeURIComponent( userData.email ) }#/test/path/to/deeplink`;
				const serviceURLNoSlashes = registry.select( STORE_NAME ).getServiceURL( { path: 'test/path/to/deeplink' } );
				expect( serviceURLNoSlashes ).toEqual( expectedURL );
				const serviceURLWithLeadingSlash = registry.select( STORE_NAME ).getServiceURL( { path: '/test/path/to/deeplink' } );
				expect( serviceURLWithLeadingSlash ).toEqual( expectedURL );
			} );

			it( 'adds query args', async () => {
				const path = '/test/path/to/deeplink';
				const query = {
					authuser: userData.email,
					param1: '1',
					param2: '2',
				};
				const serviceURL = registry.select( STORE_NAME ).getServiceURL( { path, query } );
				expect( serviceURL.startsWith( baseURI ) ).toBe( true );
				expect( serviceURL.endsWith( `#${ path }` ) ).toBe( true );
				expect( serviceURL ).toMatchQueryParameters( query );
			} );
		} );

		describe( 'getServiceReportURL', () => {
			const type = 'test-type';

			it( 'requires a report type', () => {
				expect( () => registry.select( STORE_NAME ).getServiceReportURL() )
					.toThrow( 'type is required' );
			} );

			it( 'returns `undefined` when no accountID is set', () => {
				expect( registry.select( STORE_NAME ).getAccountID() ).toBeFalsy();

				expect( registry.select( STORE_NAME ).getServiceReportURL( type ) ).toBeUndefined();
			} );

			it( 'returns `undefined` when no internalWebPropertyID is set', () => {
				registry.dispatch( STORE_NAME ).setAccountID( '12345' );
				expect( registry.select( STORE_NAME ).getInternalWebPropertyID() ).toBeFalsy();

				expect( registry.select( STORE_NAME ).getServiceReportURL( type ) ).toBeUndefined();
			} );

			it( 'returns `undefined` when no profileID is set', () => {
				registry.dispatch( STORE_NAME ).setAccountID( '12345' );
				registry.dispatch( STORE_NAME ).setInternalWebPropertyID( '34567' );
				expect( registry.select( STORE_NAME ).getProfileID() ).toBeFalsy();

				expect( registry.select( STORE_NAME ).getServiceReportURL( type ) ).toBeUndefined();
			} );

			describe( 'with necessary account data', () => {
				const [ accountID, internalWebPropertyID, profileID ] = [ '12345', '34567', '56789' ];

				beforeEach( () => {
					registry.dispatch( STORE_NAME ).setAccountID( accountID );
					registry.dispatch( STORE_NAME ).setInternalWebPropertyID( internalWebPropertyID );
					registry.dispatch( STORE_NAME ).setProfileID( profileID );
				} );

				it( 'returns a service URL for the given report type for the current account, property, and profile', () => {
					const reportServiceURL = registry.select( STORE_NAME ).getServiceReportURL( type );
					const url = new URL( reportServiceURL );
					expect( reportServiceURL.startsWith( baseURI ) ).toBe( true );
					expect( url.hash ).toBe( `#/report/${ type }/a${ accountID }w${ internalWebPropertyID }p${ profileID }/` );
				} );

				it( 'returns a service URL for the given report type including any extra report-specific arguments', () => {
					const reportArgs = { foo: 'bar' };
					const reportServiceURL = registry.select( STORE_NAME ).getServiceReportURL( type, reportArgs );
					const url = new URL( reportServiceURL );
					expect( reportServiceURL.startsWith( baseURI ) ).toBe( true );
					// For more details about how `reportArgs` are handled, see assets/js/modules/analytics/util/report-args.test.js.
					expect( url.hash ).toBe(
						`#/report/${ type }/a${ accountID }w${ internalWebPropertyID }p${ profileID }/foo=bar/`
					);
				} );
			} );
		} );
	} );
} );
