/**
 * Traffic Overview chart's published posts tests.
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
import { getPublishedPosts } from './getPublishedPosts';

describe( 'getPublishedPosts', () => {
	it( "should list each post of each marker with its marker's day and its URL on the site", () => {
		expect(
			getPublishedPosts(
				[
					{
						date: '2025-01-12',
						posts: [
							{
								title: 'Ice cream is good for your health',
								url: '/ice-cream/',
							},
						],
					},
					{
						date: '2025-01-22',
						posts: [
							{
								title: 'Eat ice cream every day',
								url: '/every-day/',
							},
							{
								title: 'The best ice cream shops guide',
								url: '/shops/',
							},
						],
					},
				],
				'http://example.com'
			)
		).toEqual( [
			{
				date: '2025-01-12',
				title: 'Ice cream is good for your health',
				url: 'http://example.com/ice-cream/',
			},
			{
				date: '2025-01-22',
				title: 'Eat ice cream every day',
				url: 'http://example.com/every-day/',
			},
			{
				date: '2025-01-22',
				title: 'The best ice cream shops guide',
				url: 'http://example.com/shops/',
			},
		] );
	} );

	it( "should resolve a post's path from the root of a site in a subdirectory", () => {
		// Analytics reports the whole path, which already starts with the
		// site's subdirectory.
		expect(
			getPublishedPosts(
				[
					{
						date: '2025-01-12',
						posts: [ { title: 'Garlic', url: '/blog/garlic/' } ],
					},
				],
				'http://example.com/blog'
			)
		).toEqual( [
			{
				date: '2025-01-12',
				title: 'Garlic',
				url: 'http://example.com/blog/garlic/',
			},
		] );
	} );

	it( 'should list no post when there are no markers', () => {
		expect( getPublishedPosts( [], 'http://example.com' ) ).toEqual( [] );
		expect( getPublishedPosts( undefined, 'http://example.com' ) ).toEqual(
			[]
		);
	} );
} );
