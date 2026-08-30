/**
 * DocumentationLink component tests.
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
import DocumentationLink from './DocumentationLink';

describe( 'DocumentationLink', () => {
	it( 'should link to the Site Kit documentation URL for a slug', () => {
		const registry = createTestRegistry();

		provideSiteInfo( registry );

		const { getByRole } = render(
			<DocumentationLink slug="rrm-publication">
				Learn more
			</DocumentationLink>,
			{ registry }
		);

		expect( getByRole( 'link' ) ).toHaveAttribute(
			'href',
			'https://sitekit.withgoogle.com/support/?doc=rrm-publication'
		);
	} );
} );
