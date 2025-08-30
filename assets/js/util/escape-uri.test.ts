/**
 * Escape URI components utility tests.
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
import { escapeURI } from './escape-uri';

describe( 'escapeURI', () => {
	it( 'should properly escape special characters in an URI', () => {
		const uri = escapeURI`http://localhost/redirect?user=${ 'admin@example.com' }&url=${ 'http://localhost/admin/' }`;
		const escaped =
			'http://localhost/redirect?user=admin%40example.com&url=http%3A%2F%2Flocalhost%2Fadmin%2F';
		expect( uri ).toBe( escaped );
	} );

	it( 'should not modify a template string that has no expressions', () => {
		expect( escapeURI`http://localhost:3000/` ).toBe(
			'http://localhost:3000/'
		);
	} );
} );
