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
import {
	populatePropertyAndAccountIds,
	populateAccountSummaries,
} from './account';

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

describe( 'populateAccountID', () => {
	const { populateAccountID } = accountUtils;

	it( 'should append the account ID if a valid account URL is present', () => {
		const account = {
			account: 'accounts/12345',
		};

		const result = populateAccountID( account );

		expect( result ).toEqual( {
			account: 'accounts/12345',
			_id: '12345',
		} );
	} );

	it( 'should return the same object if account ID is not in expected format', () => {
		const account = {
			account: 'not-a-valid-url',
		};

		const result = populateAccountID( account );

		expect( result ).toEqual( {
			account: 'not-a-valid-url',
		} );
	} );

	it( 'should return the same object if account ID is missing', () => {
		const account = {
			account: '',
		};

		const result = populateAccountID( account );

		expect( result ).toEqual( {
			account: '',
		} );
	} );
} );

describe( 'populatePropertyAndAccountIds', () => {
	it( 'should append _id and _accountID when both property and parent fields are valid', () => {
		const property = {
			property: 'properties/123',
			parent: 'accounts/456',
		};

		const result = populatePropertyAndAccountIds( property );

		expect( result._id ).toBe( '123' );
		expect( result._accountID ).toBe( '456' );
	} );

	it( 'should append only _id when parent is not valid', () => {
		const property = {
			property: 'properties/123',
			parent: 'invalid-string',
		};

		const result = populatePropertyAndAccountIds( property );

		expect( result._id ).toBe( '123' );
		expect( result._accountID ).toBeUndefined();
	} );

	it( 'should append only _accountID when property is not valid', () => {
		const property = {
			property: 'invalid-string',
			parent: 'accounts/456',
		};

		const result = populatePropertyAndAccountIds( property );

		expect( result._id ).toBeUndefined();
		expect( result._accountID ).toBe( '456' );
	} );

	it( 'should not append _id or _accountID when there are no valid matches', () => {
		const property = {
			property: 'invalid-string',
			parent: 'invalid-string',
		};

		const result = populatePropertyAndAccountIds( property );

		expect( result._id ).toBeUndefined();
		expect( result._accountID ).toBeUndefined();
	} );

	it( 'should not append _id or _accountID for empty property and parent fields', () => {
		const property = {
			property: '',
			parent: '',
		};

		const result = populatePropertyAndAccountIds( property );

		expect( result._id ).toBeUndefined();
		expect( result._accountID ).toBeUndefined();
	} );

	it( 'should not throw and should return an unchanged object when fields are missing', () => {
		const property = {};

		const result = populatePropertyAndAccountIds( property );

		expect( result._id ).toBeUndefined();
		expect( result._accountID ).toBeUndefined();
		expect( result ).toEqual( {} );
	} );
} );

describe( 'populateAccountSummaries', () => {
	it( 'returns given if not array', () => {
		expect( populateAccountSummaries( 123 ) ).toBe( 123 );
		expect( populateAccountSummaries( null ) ).toBe( null );
		expect( populateAccountSummaries( {} ) ).toEqual( {} );
	} );

	it( 'populates account IDs for all summaries', () => {
		const sumA = { account: 'accounts/123' };
		const sumB = { account: 'accounts/234' };
		const sumC = { account: 'accounts/345' };

		const result = populateAccountSummaries( [ sumA, sumB, sumC ] );

		expect( result ).toMatchObject( [
			{ _id: '123', ...sumA },
			{ _id: '234', ...sumB },
			{ _id: '345', ...sumC },
		] );
	} );

	it( 'populates account + property IDs for all property summaries', () => {
		const sumA = { account: 'accounts/123', propertySummaries: [] };
		const sumB = { account: 'accounts/234' };
		const sumC = {
			account: 'accounts/345',
			propertySummaries: [
				{ parent: 'accounts/345', property: 'properties/3450' },
				{ parent: 'accounts/345', property: 'properties/3451' },
			],
		};

		const result = populateAccountSummaries( [ sumA, sumB, sumC ] );

		expect( result ).toMatchObject( [
			{ ...sumA, _id: '123' },
			{ ...sumB, _id: '234', propertySummaries: [] },
			{
				...sumC,
				_id: '345',
				propertySummaries: [
					{
						parent: 'accounts/345',
						_accountID: '345',
						property: 'properties/3450',
						_id: '3450',
					},
					{
						parent: 'accounts/345',
						_accountID: '345',
						property: 'properties/3451',
						_id: '3451',
					},
				],
			},
		] );
	} );
} );
