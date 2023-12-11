/**
 * Account helper tests.
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
 * Internal dependencies
 */
import { ENHANCED_MEASUREMENT_ENABLED } from '../datastore/constants';
import * as accountUtils from './account';

describe( 'getAccountDefaults', () => {
	const siteURL = 'https://example.com/';
	const siteName = 'Example Site';
	const timezone = 'Europe/Kiev';
	const fallbackTimezone = 'Europe/Berlin';

	// The fallback timezone is used here to avoid location-sensitive results,
	// but also because the default fallback will raise errors otherwise due to tests
	// running in a Node environment instead of a browser environment.
	const getAccountDefaults = ( args ) =>
		accountUtils.getAccountDefaults( args, fallbackTimezone );

	it( 'should throw an error if siteURL is invalid', () => {
		expect( () =>
			getAccountDefaults( { siteName, siteURL: undefined, timezone } )
		).toThrow( 'A valid siteURL is required.' );
	} );

	describe( 'accountName', () => {
		it( 'should be equal to siteName when siteName is not empty', () => {
			expect(
				getAccountDefaults( { siteName, siteURL, timezone } )
					.accountName
			).toBe( 'Example Site' );
		} );

		it( 'should be the domain name of the siteURL when siteName is falsy', () => {
			expect(
				getAccountDefaults( { siteName: '', siteURL, timezone } )
					.accountName
			).toBe( 'example.com' );
		} );
	} );

	describe( 'propertyName', () => {
		it( 'should be just domain name when the path of the siteURL is just a forward slash', () => {
			expect(
				getAccountDefaults( {
					siteName,
					siteURL: 'https://example.com/',
					timezone,
				} ).propertyName
			).toBe( 'example.com' );
		} );

		it( 'should be domain name + path when the siteURL contains non-empty path', () => {
			expect(
				getAccountDefaults( {
					siteName: '',
					siteURL: 'https://example.com/subsite-slug/',
					timezone,
				} ).propertyName
			).toBe( 'example.com/subsite-slug' );
		} );
	} );

	describe( 'dataStreamName', () => {
		it( 'should be the domain name of the siteURL', () => {
			expect(
				getAccountDefaults( { siteName, siteURL, timezone } )
					.dataStreamName
			).toBe( 'example.com' );
		} );
	} );

	describe( 'countryCode', () => {
		it( 'should be equal to UA when timezone is Europe/Kiev', () => {
			expect(
				getAccountDefaults( { siteName, siteURL, timezone } )
					.countryCode
			).toBe( 'UA' );
		} );
	} );

	describe( 'timezone', () => {
		it( 'should be the same as provided', () => {
			expect(
				getAccountDefaults( { siteName, siteURL, timezone } ).timezone
			).toBe( 'Europe/Kiev' );
		} );

		it( 'should use the fallback timezone when the provided timezone does not have an entry in countryCodesByTimezone', () => {
			expect(
				getAccountDefaults( { siteName, siteURL, timezone: 'UTC' } )
					.timezone
			).toBe( fallbackTimezone );
		} );
	} );

	describe( 'enhanced measurement enabled', () => {
		it( 'defaults to true', () => {
			expect(
				getAccountDefaults( { siteName, siteURL, timezone } )
			).toHaveProperty( ENHANCED_MEASUREMENT_ENABLED, true );
		} );
	} );
} );
