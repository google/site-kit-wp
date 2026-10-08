/**
 * Recent activity latest post header tests.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { LATEST_POST } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { createTestRegistry, render } from '@tests/js/test-utils';
import { provideSiteInfo } from '@tests/js/utils';
import LatestPostHeader from './LatestPostHeader';

describe( 'LatestPostHeader', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
	} );

	it( 'links the post title to the entity dashboard of the post', () => {
		const { getByRole } = render(
			<LatestPostHeader post={ LATEST_POST } />,
			{ registry }
		);

		expect(
			getByRole( 'link', { name: 'Ice cream is good for your health' } )
		).toHaveAttribute(
			'href',
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&permaLink=https%3A%2F%2Fexample.com%2Fice-cream%2F'
		);
	} );

	it( 'shows the publish date and time without the year', () => {
		const { getByText } = render(
			<LatestPostHeader
				post={ {
					...LATEST_POST,
					// 14:30 on July 14 in the browser's time zone, so the test
					// passes in any time zone.
					publishedAt: new Date( 2026, 6, 14, 14, 30 ).toISOString(),
				} }
			/>,
			{ registry }
		);

		expect(
			getByText( /^posted July 14\b.*\b2:30\sPM$/ )
		).toBeInTheDocument();
	} );
} );
