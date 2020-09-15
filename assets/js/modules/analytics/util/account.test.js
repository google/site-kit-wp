/**
 * Account helper tests.
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

import { getAccountDefaults } from './account';

describe( 'getAccountDefaults', () => {
	const sufficientArgs = {
		siteName: 'Example Site',
		siteURL: 'https://example.com/',
		timezone: 'Europe/Kiev',
	};

	const namelessArgs = {
		siteURL: 'https://example.com/subsite-slug/',
		timezone: 'Europe/Kiev',
	};

	it( 'should return accountName equal to siteName when it\'s not empty', () => {
		expect( getAccountDefaults( sufficientArgs ).accountName ).toBe( 'Example Site' );
	} );

	it( 'should return propertyName equal to the domain name when siteURL is not empty', () => {
		expect( getAccountDefaults( sufficientArgs ).propertyName ).toBe( 'example.com' );
	} );

	it( 'should return a default profileName', () => {
		expect( getAccountDefaults( sufficientArgs ).profileName ).toBe( 'All Web Site Data' );
	} );

	it( 'should return countryCode equal to UA when timezone is Europe/Kiev', () => {
		expect( getAccountDefaults( sufficientArgs ).countryCode ).toBe( 'UA' );
	} );

	it( 'should return the same timezone as provided', () => {
		expect( getAccountDefaults( sufficientArgs ).timezone ).toBe( sufficientArgs.timezone );
	} );

	it( 'should use doman name as accountName when siteName is not provided', () => {
		expect( getAccountDefaults( namelessArgs ).accountName ).toBe( 'example.com' );
	} );

	it( 'should use domain name + path as propertyName when siteName is not provided', () => {
		expect( getAccountDefaults( namelessArgs ).propertyName ).toBe( 'example.com/subsite-slug' );
	} );
} );
