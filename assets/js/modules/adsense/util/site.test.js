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

/* eslint-disable camelcase */
/* eslint-disable sitekit/acronym-case */
const site_www_example_com = {
	domain: 'www.example.com',
	name: 'accounts/pub-1234567890/sites/www.example.com',
	reportingDimensionId: 'ca-pub-1234567890:www.example.com',
};

const site_example_com = {
	autoAdsEnabled: null,
	domain: 'example.com',
	name: 'accounts/pub-1234567890/sites/example.com',
	reportingDimensionId: 'ca-pub-1234567890:example.com',
	state: 'NEEDS_ATTENTION',
};

const site_foo_test = {
	autoAdsEnabled: null,
	domain: 'foo.test',
	name: 'accounts/pub-1234567890/sites/foo.test',
	reportingDimensionId: 'ca-pub-1234567890:foo.test',
	state: 'READY',
};

const site_ffoo_test = {
	autoAdsEnabled: null,
	domain: 'ffoo.test',
	name: 'accounts/pub-1234567890/sites/ffoo.test',
	reportingDimensionId: 'ca-pub-1234567890:ffoo.test',
	state: 'READY',
};
/* eslint-enable sitekit/acronym-case */

describe( 'determineSiteFromDomain', () => {
	it.each( [
		[ undefined, undefined ],
		[ undefined, 'www.example.com' ],
		[ [ site_example_com, site_www_example_com ], undefined ],
	] )( 'returns undefined for undefined parameters', ( sites, domain ) => {
		expect( determineSiteFromDomain( sites, domain ) ).toEqual( undefined );
	} );

	it.each( [
		[ 'www.example.com', site_example_com ],
		[ 'www.eXAmPle.COm', site_example_com ],
		[ 'othersubdomain.example.com', site_example_com ],
		[ 'www.foo.test', site_foo_test ],
		[ 'foo.test', site_foo_test ],
		[ 'bar.test', null ],
		// Make sure only subdomains match partial site domains
		[ 'oo.test', null ],
		[ 'ffoo.test', site_ffoo_test ],
	] )(
		'returns the correct site for the domain: %s',
		( domain, expected ) => {
			const sites = [
				site_www_example_com,
				site_example_com,
				site_foo_test,
				site_ffoo_test,
			];
			expect( determineSiteFromDomain( sites, domain ) ).toEqual(
				expected
			);
		}
	);
} );
