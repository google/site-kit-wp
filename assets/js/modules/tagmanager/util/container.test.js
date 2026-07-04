/**
 * `modules/tagmanager` util: container function tests.
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
import { getNormalizedContainerName } from './container';

describe( 'tag manager / utils / container', () => {
	describe( 'getNormalizedContainerName', () => {
		it.each( [
			[ 'Example Site Name', 'Example Site Name' ],
			[ 'Exåmplé Sïtē Nàmę', 'Example Site Name' ],
			[ '_Example_Site_Name_', 'Example_Site_Name_' ],
			[ 'Example Site & Name', 'Example Site Name' ],
			[ 'Example Site &amp; Name', 'Example Site Name' ],
			[ 'Example Site with 🔥 Name', 'Example Site with Name' ],
			[
				'Example Site with "double quotes"',
				'Example Site with double quotes',
			],
			[
				'Example Site with &quot;double quotes&quot;',
				'Example Site with double quotes',
			],
			[
				"Example Site with 'single quotes'",
				'Example Site with single quotes',
			],
			[
				'Example Site with &#39;single quotes&#39;',
				'Example Site with single quotes',
			],
			[
				'Example Site with `~!@#$%^&*()_+[]{}\\|;"<>,./?',
				'Example Site with _,.',
			],
		] )( 'should properly normalize %s', ( before, after ) => {
			expect( getNormalizedContainerName( before ) ).toBe( after );
		} );
	} );
} );
