/**
 * Recent activity reference permalink helper tests.
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
import { getReferencePermalink } from './getReferencePermalink';

describe( 'getReferencePermalink', () => {
	it.each( [
		[
			'a post with a pretty permalink',
			'https://staging.example.com/hello-world/',
			'https://example.com/',
			'https://example.com/hello-world/',
		],
		[
			'a post with a plain permalink',
			'https://staging.example.com/?p=42',
			'https://example.com/',
			'https://example.com/?p=42',
		],
		[
			'a reference site URL with a path',
			'https://staging.example.com/hello-world/',
			'https://example.com/blog/',
			'https://example.com/blog/hello-world/',
		],
	] )(
		'should replace the home URL with the reference site URL for %s',
		( _label, permalink, referenceSiteURL, expected ) => {
			expect(
				getReferencePermalink(
					permalink,
					'https://staging.example.com/',
					referenceSiteURL
				)
			).toBe( expected );
		}
	);

	it( 'should return the permalink unchanged when the reference site URL is the home URL', () => {
		expect(
			getReferencePermalink(
				'https://example.com/hello-world/',
				'https://example.com/',
				'https://example.com/'
			)
		).toBe( 'https://example.com/hello-world/' );
	} );

	it( 'should return the permalink unchanged when it is on another host that starts with the home URL', () => {
		expect(
			getReferencePermalink(
				'https://example.com.au/hello-world/',
				'https://example.com',
				'https://live.example.com'
			)
		).toBe( 'https://example.com.au/hello-world/' );
	} );

	it( 'should give the same URL when the home URL and the reference site URL have no trailing slash', () => {
		expect(
			getReferencePermalink(
				'https://staging.example.com/hello-world/',
				'https://staging.example.com',
				'https://example.com'
			)
		).toBe( 'https://example.com/hello-world/' );
	} );
} );
