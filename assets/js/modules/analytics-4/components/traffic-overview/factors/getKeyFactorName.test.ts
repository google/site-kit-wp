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
			getKeyFactorName(
				{ kind: 'CONTENT', label: '/' },
				'https://example.com'
			)
		).toBe( 'Homepage' );
	} );

	it( 'should name any other landing page by its label', () => {
		expect(
			getKeyFactorName(
				{ kind: 'CONTENT', label: '/hello-world/' },
				'https://example.com'
			)
		).toBe( '/hello-world/' );
		expect(
			getKeyFactorName(
				{ kind: 'CONTENT', label: 'Hello world' },
				'https://example.com'
			)
		).toBe( 'Hello world' );
	} );

	it( 'should name the group of the paid channels "Paid traffic", whatever its label', () => {
		expect(
			getKeyFactorName( { kind: 'CHANNEL_GROUP', label: 'Paid' } )
		).toBe( 'Paid traffic' );
	} );

	it.each( [
		[ 'Cross-network ads', 'Cross-network ads' ],
		[ 'Cross-network', 'Cross-network ads' ],
		[ 'Uncategorized traffic', 'Uncategorized traffic' ],
		[ 'Unassigned', 'Uncategorized traffic' ],
	] )(
		'should name a channel the Site Kit service names, `%s`, as "%s"',
		( label, name ) => {
			expect( getKeyFactorName( { kind: 'CHANNEL', label } ) ).toBe(
				name
			);
		}
	);

	it.each( [
		[ 'CHANNEL', 'Organic Search' ],
		[ 'REFERRING_SITE', 'news.example' ],
		[ 'CAMPAIGN', 'spring_sale' ],
	] as const )( 'should name a %s card by its label', ( kind, label ) => {
		expect( getKeyFactorName( { kind, label } ) ).toBe( label );
	} );

	it( 'should not name a referring site or a campaign as a channel, even when its label is a channel’s name', () => {
		expect(
			getKeyFactorName( { kind: 'REFERRING_SITE', label: 'Unassigned' } )
		).toBe( 'Unassigned' );
	} );

	it.each( [
		[ 'CHANNEL', 'Direct', 'Direct (other pages)' ],
		[ 'CHANNEL', 'Unassigned', 'Uncategorized traffic (other pages)' ],
		[ 'CHANNEL_GROUP', 'Paid traffic', 'Paid traffic (other pages)' ],
	] as const )(
		'should name the %s card `%s` for its channel’s other pages "%s"',
		( kind, label, name ) => {
			expect(
				getKeyFactorName( { kind, label, otherPages: true } )
			).toBe( name );
		}
	);
} );
