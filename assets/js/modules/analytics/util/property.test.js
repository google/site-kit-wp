/**
 * Property helper tests.
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
import { matchPropertyByURL } from './property';

describe( 'matchPropertyByURL', () => {
	const properties = [
		/* eslint-disable sitekit/acronym-case */
		{ websiteUrl: 'http://example.com' },
		{ websiteUrl: 'http://www.example.org/' },
		/* eslint-enable */
	];

	it( 'should return a correct property that has matching website URL', () => {
		const property = matchPropertyByURL(
			properties,
			'https://www.example.com'
		);
		expect( property ).toEqual( properties[ 0 ] );
	} );

	it( 'should return NULL when URL does not match', () => {
		const property = matchPropertyByURL(
			properties,
			'http://wrongsite.com'
		);
		expect( property ).toBeNull();
	} );
} );
