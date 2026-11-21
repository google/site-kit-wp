/**
 * Traffic Overview `getKeyFactorName` utility tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { getKeyFactorName } from './getKeyFactorName';

describe( 'getKeyFactorName', () => {
	it( 'should name the landing page that is the site’s homepage "Homepage"', () => {
		expect(
			getKeyFactorName( 'CONTENT', '/', 'https://example.com' )
		).toBe( 'Homepage' );
	} );

	it( 'should name any other landing page by its path', () => {
		expect(
			getKeyFactorName(
				'CONTENT',
				'/hello-world/',
				'https://example.com'
			)
		).toBe( '/hello-world/' );
	} );

	it( 'should name the group of the paid channels "Paid traffic", whatever its label', () => {
		expect( getKeyFactorName( 'CHANNEL_GROUP', 'Paid' ) ).toBe(
			'Paid traffic'
		);
	} );

	it.each( [
		[ 'CHANNEL', 'Organic Search' ],
		[ 'REFERRING_SITE', 'news.example' ],
		[ 'CAMPAIGN', 'spring_sale' ],
	] as const )( 'should name a %s card by its label', ( kind, label ) => {
		expect( getKeyFactorName( kind, label ) ).toBe( label );
	} );
} );
