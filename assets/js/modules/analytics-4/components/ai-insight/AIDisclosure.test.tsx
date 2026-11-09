/**
 * AIDisclosure component tests.
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
import {
	createTestRegistry,
	provideSiteInfo,
	render,
} from '@tests/js/test-utils';
import AIDisclosure from './AIDisclosure';

describe( 'AIDisclosure', () => {
	it( 'should point "Learn more" to the AI insights documentation page', () => {
		const registry = createTestRegistry();

		provideSiteInfo( registry );

		const { getByRole } = render( <AIDisclosure />, { registry } );

		expect( getByRole( 'link', { name: /learn more/i } ) ).toHaveAttribute(
			'href',
			'https://sitekit.withgoogle.com/support/?doc=ai-insights'
		);
	} );
} );
