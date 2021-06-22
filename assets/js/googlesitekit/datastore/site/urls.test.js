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
import { createTestRegistry, unsubscribeFromAll } from '../../../../../tests/js/utils';
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

	describe( 'selectors', () => {
		describe( 'getGoogleSupportURL', () => {
			it.each( [
				[
					'returns null if no arguments are supplied',
					undefined,
					null,
				],
				[
					'returns null if no path is supplied or is empty',
					{
						path: '',
					},
					null,
				],
				[
					'returns the path, hash and the user locale',
					{
						path: '/analytics/answer/1032415',
						hash: 'hash_value',
					},
					'https://support.google.com/analytics/answer/1032415?hl=en-US#hash_value',
				],
				[
					'returns the path, query and the user locale',
					{
						path: '/analytics/answer/1032415',
						query: {
							param: 'value',
							param2: 'value2',
						},
					},
					'https://support.google.com/analytics/answer/1032415?param=value&param2=value2&hl=en-US',
				],
				[
					'returns the path with the user locale',
					{
						path: '/analytics/answer/1032415',
					},
					'https://support.google.com/analytics/answer/1032415?hl=en-US',
				],
				[
					'returns the path, query, hash and the user locale',
					{
						path: '/analytics/answer/1032415',
						query: {
							param: 'value',
							param2: 'value2',
						},
						hash: 'hash_value',
					},
					'https://support.google.com/analytics/answer/1032415?param=value&param2=value2&hl=en-US#hash_value',
				],
			] )( '%s', async ( _, args, expected ) => {
				await registry.dispatch( STORE_NAME ).receiveSiteInfo( { ...baseInfo, ...entityInfo } );
				const supportURL = registry.select( STORE_NAME ).getGoogleSupportURL( args );
				expect( supportURL ).toEqual( expected );
			} );

			it( 'returns the path with a predefined locale', async () => {
				await registry.dispatch( STORE_NAME ).receiveSiteInfo( { ...baseInfo, ...entityInfo } );

				if ( ! global._googlesitekitLegacyData ) {
					global._googlesitekitLegacyData = {};
				}
				global._googlesitekitLegacyData.locale = 'de';

				const supportURL = registry.select( STORE_NAME ).getGoogleSupportURL( {
					path: '/analytics/answer/1032415',
				} );
				expect( supportURL ).toEqual( 'https://support.google.com/analytics/answer/1032415?hl=de' );
			} );
		} );
	} );
} );
