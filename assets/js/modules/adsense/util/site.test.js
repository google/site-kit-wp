/**
 * Site utility tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { determineSiteFromDomain } from './site';
import * as fixtures from '../datastore/__fixtures__';

describe( 'determineSiteFromDomain', () => {
	it.each( [
		[ undefined, undefined ],
		[ undefined, 'www.example.com' ],
		[ fixtures.sites, undefined ],
	] )( 'returns undefined for undefined parameters', ( sites, domain ) => {
		expect( determineSiteFromDomain( sites, domain ) ).toEqual( undefined );
	} );

	it.each( [
		[ 'www.example.com', fixtures.sites[ 0 ] ],
		[ 'www.eXAmPle.COm', fixtures.sites[ 0 ] ],
		[ 'othersubdomain.example.com', fixtures.sites[ 0 ] ],
		[ 'www.test-site.com', fixtures.sites[ 1 ] ],
		[ 'some-other-tld.ie', fixtures.sites[ 2 ] ],
	] )(
		'returns the correct site for the domain: %s',
		( domain, expected ) => {
			expect( determineSiteFromDomain( fixtures.sites, domain ) ).toEqual(
				expected
			);
		}
	);
} );
