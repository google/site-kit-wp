/**
 * `core/site` data store, site info tests.
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
import {
	createTestRegistry,
	untilResolved,
	unsubscribeFromAll,
	provideSiteInfo,
} from '../../../../../tests/js/utils';
import { initialState } from './index';
import { STORE_NAME } from './constants';

describe( 'core/site site info', () => {
	const baseInfoVar = '_googlesitekitBaseData';
	const baseInfo = {
		adminURL: 'http://something.test/wp-admin',
		ampMode: 'reader',
		homeURL: 'http://something.test/homepage',
		referenceSiteURL: 'http://example.com',
		proxyPermissionsURL: '', // not available until site is authenticated
		proxySetupURL: 'https://sitekit.withgoogle.com/site-management/setup/', // params omitted
		siteName: 'Something Test',
		timezone: 'America/Denver',
		usingProxy: true,
	};
	const entityInfoVar = '_googlesitekitEntityData';
	const entityInfo = {
		currentEntityURL: 'http://something.test',
		currentEntityType: 'post',
		currentEntityTitle: 'Something Witty',
		currentEntityID: '4',
	};
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		delete global[ baseInfoVar ];
		delete global[ entityInfoVar ];
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'receiveSiteInfo', () => {
			it( 'requires the siteInfo param', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).receiveSiteInfo();
				} ).toThrow( 'siteInfo is required.' );
			} );

			it( 'receives and sets site info ', async () => {
				await registry.dispatch( STORE_NAME ).receiveSiteInfo( { ...baseInfo, ...entityInfo } );

				expect(
					registry.select( STORE_NAME ).getSiteInfo()
				).toMatchObject( { ...baseInfo, ...entityInfo, currentEntityID: 4 } );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getAdminURL', () => {
			it( 'returns the adminURL on its own if no page argument is supplied', async () => {
				await registry.dispatch( STORE_NAME ).receiveSiteInfo( { ...baseInfo, ...entityInfo } );

				let adminURL = registry.select( STORE_NAME ).getAdminURL();
				expect( adminURL ).toEqual( 'http://something.test/wp-admin' );

				adminURL = registry.select( STORE_NAME ).getAdminURL( undefined, { arg1: 'argument-1', arg2: 'argument-2' } );
				expect( adminURL ).toEqual( 'http://something.test/wp-admin' );
			} );

			it( 'returns the adminURL with page query parameter if simple page argument is supplied', async () => {
				await registry.dispatch( STORE_NAME ).receiveSiteInfo( { ...baseInfo, ...entityInfo } );

				const adminURL = registry.select( STORE_NAME ).getAdminURL( 'testpage' );
				expect( adminURL ).toEqual( 'http://something.test/wp-admin/admin.php?page=testpage' );
			} );

			it( 'returns the adminURL with page query parameter if the full page argument is supplied', async () => {
				await registry.dispatch( STORE_NAME ).receiveSiteInfo( { ...baseInfo, ...entityInfo } );

				const adminURL = registry.select( STORE_NAME ).getAdminURL( 'custom.php?page=testpage' );
				expect( adminURL ).toEqual( 'http://something.test/wp-admin/custom.php?page=testpage' );
			} );

			it( 'returns the original adminURL if the full page argument is supplied without "page" query param', async () => {
				await registry.dispatch( STORE_NAME ).receiveSiteInfo( { ...baseInfo, ...entityInfo } );

				const adminURL = registry.select( STORE_NAME ).getAdminURL( 'custom.php?notpage=testpage' );
				expect( adminURL ).toEqual( 'http://something.test/wp-admin' );
			} );

			it( 'properly handles the adminURLs with trailing slash', async () => {
				await registry.dispatch( STORE_NAME ).receiveSiteInfo( { ...baseInfo, ...entityInfo, adminURL: 'http://something.test/wp-admin/' } );

				const adminURL = registry.select( STORE_NAME ).getAdminURL( 'custom.php?page=testpage' );
				expect( adminURL ).toEqual( 'http://something.test/wp-admin/custom.php?page=testpage' );
			} );

			it( 'returns the adminURL with page and extra query if page and args supplied', async () => {
				await registry.dispatch( STORE_NAME ).receiveSiteInfo( { ...baseInfo, ...entityInfo } );

				const adminURL = registry.select( STORE_NAME ).getAdminURL( 'testpage', { arg1: 'argument-1', arg2: 'argument-2' } );
				expect( adminURL ).toEqual( 'http://something.test/wp-admin/admin.php?page=testpage&arg1=argument-1&arg2=argument-2' );
			} );

			it( 'returns the adminURL with first page if an extra page is provided in the args', async () => {
				await registry.dispatch( STORE_NAME ).receiveSiteInfo( { ...baseInfo, ...entityInfo } );

				const adminURL = registry.select( STORE_NAME ).getAdminURL( 'correct-page', { arg1: 'argument-1', arg2: 'argument-2', page: 'wrong-page' } );
				expect( adminURL ).toEqual( 'http://something.test/wp-admin/admin.php?page=correct-page&arg1=argument-1&arg2=argument-2' );
			} );

			it( 'returns undefined if adminURL is undefined', async () => {
				await registry.dispatch( STORE_NAME ).receiveSiteInfo( {} );

				const adminURL = registry.select( STORE_NAME ).getAdminURL();

				expect( adminURL ).toEqual( undefined );
			} );
		} );

		describe( 'getSiteInfo', () => {
			it( 'uses a resolver to load site info from a global variable by default, then deletes that global variable after consumption', async () => {
				global[ baseInfoVar ] = baseInfo;
				global[ entityInfoVar ] = entityInfo;

				expect( global[ baseInfoVar ] ).not.toEqual( undefined );
				expect( global[ entityInfoVar ] ).not.toEqual( undefined );

				registry.select( STORE_NAME ).getSiteInfo();
				await untilResolved( registry, STORE_NAME ).getSiteInfo();

				const info = registry.select( STORE_NAME ).getSiteInfo();

				expect( info ).toEqual( { ...baseInfo, ...entityInfo, currentEntityID: 4 } );

				// Data must not be wiped after retrieving, as it could be used by other dependants.
				expect( global[ baseInfoVar ] ).not.toEqual( undefined );
				expect( global[ entityInfoVar ] ).not.toEqual( undefined );
			} );

			it( 'will return initial state (undefined) when no data is available', async () => {
				expect( global[ baseInfoVar ] ).toEqual( undefined );
				expect( global[ entityInfoVar ] ).toEqual( undefined );

				const info = registry.select( STORE_NAME ).getSiteInfo();

				expect( info ).toBe( initialState.siteInfo );
				expect( console ).toHaveErrored();
			} );
		} );

		describe.each( [
			[ 'getAdminURL', 'adminURL' ],
			[ 'getAMPMode', 'ampMode' ],
			[ 'getCurrentEntityID', 'currentEntityID' ],
			[ 'getCurrentEntityTitle', 'currentEntityTitle' ],
			[ 'getCurrentEntityType', 'currentEntityType' ],
			[ 'getCurrentEntityURL', 'currentEntityURL' ],
			[ 'getHomeURL', 'homeURL' ],
			[ 'getReferenceSiteURL', 'referenceSiteURL' ],
			[ 'getProxySetupURL', 'proxySetupURL' ],
			[ 'getProxyPermissionsURL', 'proxyPermissionsURL' ],
			[ 'getSiteName', 'siteName' ],
			[ 'getTimezone', 'timezone' ],
			[ 'isUsingProxy', 'usingProxy' ],
			[ 'isAMP', 'ampMode' ],
			[ 'isPrimaryAMP', 'ampMode' ],
			[ 'isSecondaryAMP', 'ampMode' ],
			[ 'isWebStoriesActive', 'webStoriesActive' ],
		] )( `%s`, ( selector, infoKey ) => {
			it( 'uses a resolver to load site info then returns the info when this specific selector is used', async () => {
				global[ baseInfoVar ] = baseInfo;
				global[ entityInfoVar ] = entityInfo;

				registry.select( STORE_NAME )[ selector ]();

				await untilResolved( registry, STORE_NAME ).getSiteInfo();

				const info = registry.select( STORE_NAME ).getSiteInfo();

				expect( info ).toHaveProperty( infoKey );
				expect( info ).toEqual( { ...baseInfo, ...entityInfo, currentEntityID: 4 } );
			} );

			it( 'will return initial state (undefined) when no data is available', async () => {
				expect( global[ baseInfoVar ] ).toEqual( undefined );
				expect( global[ entityInfoVar ] ).toEqual( undefined );

				const result = registry.select( STORE_NAME )[ selector ]();

				expect( result ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'isAMP', () => {
			it( 'uses a resolver to load site info, then returns true if AMP mode is set', async () => {
				global[ baseInfoVar ] = baseInfo;
				global[ entityInfoVar ] = entityInfo;

				registry.select( STORE_NAME ).isAMP();

				await untilResolved( registry, STORE_NAME ).getSiteInfo();

				const isAMP = registry.select( STORE_NAME ).isAMP();

				expect( isAMP ).toEqual( true );
			} );

			it( 'uses a resolver to load site info, then returns false if AMP mode is not set', async () => {
				global[ baseInfoVar ] = {
					...baseInfo,
					ampMode: null,
				};
				global[ entityInfoVar ] = entityInfo;

				registry.select( STORE_NAME ).isAMP();
				await untilResolved( registry, STORE_NAME ).getSiteInfo();

				const isAMP = registry.select( STORE_NAME ).isAMP();

				expect( isAMP ).toEqual( false );
			} );

			it( 'will return initial state (undefined) when no data is available', async () => {
				expect( global[ baseInfoVar ] ).toEqual( undefined );
				expect( global[ entityInfoVar ] ).toEqual( undefined );

				const result = registry.select( STORE_NAME ).isAMP();

				expect( result ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'getCurrentReferenceURL', () => {
			it( 'uses a resolver to load site info, then returns entity URL if set', async () => {
				global[ baseInfoVar ] = baseInfo;
				global[ entityInfoVar ] = entityInfo;

				registry.select( STORE_NAME ).getCurrentReferenceURL();
				await untilResolved( registry, STORE_NAME ).getSiteInfo();

				const referenceURL = registry.select( STORE_NAME ).getCurrentReferenceURL();

				expect( referenceURL ).toEqual( entityInfo.currentEntityURL );
			} );

			it( 'uses a resolver to load site info, then returns reference site URL if entity URL not set', async () => {
				global[ baseInfoVar ] = baseInfo;
				// Set empty entity info as it would come from the server in such a case.
				global[ entityInfoVar ] = {
					currentEntityURL: null,
					currentEntityType: null,
					currentEntityTitle: null,
					currentEntityID: null,
				};

				registry.select( STORE_NAME ).getCurrentReferenceURL();
				await untilResolved( registry, STORE_NAME ).getSiteInfo();

				const referenceURL = registry.select( STORE_NAME ).getCurrentReferenceURL();

				expect( referenceURL ).toEqual( baseInfo.referenceSiteURL );
			} );
		} );

		describe( 'isSiteURLMatch', () => {
			beforeEach( async () => {
				await registry.dispatch( STORE_NAME ).receiveSiteInfo( baseInfo );
			} );

			it( 'should return TRUE when URL matches the reference site URL even if the protocol is different', () => {
				expect( registry.select( STORE_NAME ).isSiteURLMatch( 'http://example.com' ) ).toBe( true );
				expect( registry.select( STORE_NAME ).isSiteURLMatch( 'https://example.com' ) ).toBe( true );
			} );

			it( 'should return TRUE when URL matches the reference site URL with or without a www. subdomain', () => {
				expect( registry.select( STORE_NAME ).isSiteURLMatch( 'http://example.com' ) ).toBe( true );
				expect( registry.select( STORE_NAME ).isSiteURLMatch( 'http://www.example.com' ) ).toBe( true );
			} );

			it( 'should return TRUE when URL matches the reference site URL with or without a trailing slash', () => {
				expect( registry.select( STORE_NAME ).isSiteURLMatch( 'http://example.com' ) ).toBe( true );
				expect( registry.select( STORE_NAME ).isSiteURLMatch( 'http://example.com/' ) ).toBe( true );
			} );

			it( 'should return FALSE when URL does not match the reference site URL', () => {
				expect( registry.select( STORE_NAME ).isSiteURLMatch( 'http://example.org/' ) ).toBe( false );
			} );
		} );

		describe( 'getSiteURLPermutations', () => {
			it( 'should correctly process regular URL', () => {
				provideSiteInfo( registry, { referenceSiteURL: 'http://www.example.com' } );

				expect( registry.select( STORE_NAME ).getSiteURLPermutations() ).toEqual( [
					'http://example.com',
					'https://example.com',
					'https://www.example.com',
					'http://www.example.com',
				] );
			} );

			it( 'should correctly process URL with a port number', () => {
				provideSiteInfo( registry, { referenceSiteURL: 'http://example.com:9000/' } );

				expect( registry.select( STORE_NAME ).getSiteURLPermutations() ).toEqual( [
					'http://example.com:9000',
					'https://example.com:9000',
					'https://www.example.com:9000',
					'http://www.example.com:9000',
				] );
			} );

			it( 'should correctly process URL with basic authentication', () => {
				provideSiteInfo( registry, { referenceSiteURL: 'http://admin:password@example.com:9000/' } );

				expect( registry.select( STORE_NAME ).getSiteURLPermutations() ).toEqual( [
					'http://admin:password@example.com:9000',
					'https://admin:password@example.com:9000',
					'https://admin:password@www.example.com:9000',
					'http://admin:password@www.example.com:9000',
				] );
			} );

			it( 'should correctly process URL with subdirectory install', () => {
				provideSiteInfo( registry, { referenceSiteURL: 'http://www.example.com/subsite/' } );

				expect( registry.select( STORE_NAME ).getSiteURLPermutations() ).toEqual( [
					'http://example.com/subsite',
					'https://example.com/subsite',
					'https://www.example.com/subsite',
					'http://www.example.com/subsite',
				] );
			} );
		} );
	} );
} );
