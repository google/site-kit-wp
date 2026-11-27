/**
 * Traffic Overview `getKeyFactorAttributeName` utility tests.
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
import { getKeyFactorAttributeName } from './getKeyFactorAttributeName';

describe( 'getKeyFactorAttributeName', () => {
	it( 'should name a landing page by its title when it has one', () => {
		expect(
			getKeyFactorAttributeName(
				{
					kind: 'LANDING_PAGE',
					label: '/how-to-plant-garlic/',
					title: 'How to plant garlic',
				},
				'https://example.com'
			)
		).toBe( 'How to plant garlic' );
	} );

	it( 'should name a landing page without a title by its path', () => {
		expect(
			getKeyFactorAttributeName(
				{ kind: 'LANDING_PAGE', label: '/how-to-plant-garlic/' },
				'https://example.com'
			)
		).toBe( '/how-to-plant-garlic/' );
	} );

	it( 'should name the site’s homepage "Homepage"', () => {
		expect(
			getKeyFactorAttributeName(
				{ kind: 'LANDING_PAGE', label: '/blog/' },
				'https://example.com/blog'
			)
		).toBe( 'Homepage' );
	} );

	it.each( [
		[ 'Cross-network', 'Cross-network ads' ],
		[ 'Uncategorized traffic', 'Uncategorized traffic' ],
		[ 'Paid Search', 'Paid Search' ],
	] )( 'should name a traffic channel `%s` as "%s"', ( label, name ) => {
		expect(
			getKeyFactorAttributeName( { kind: 'TRAFFIC_CHANNEL', label } )
		).toBe( name );
	} );

	it.each( [
		[ 'SEARCH_KEYWORD', 'how to plant garlic' ],
		[ 'REFERRING_SITE', 'news.example' ],
		[ 'DEVICE', 'desktop' ],
		[ 'USER_TYPE', 'new' ],
	] as const )( 'should name a %s by its value', ( kind, label ) => {
		expect(
			getKeyFactorAttributeName( { kind, label, title: 'A title' } )
		).toBe( label );
	} );
} );
