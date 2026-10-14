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
import { provideSiteInfo, provideTimezone } from '@tests/js/utils';
import LatestPostHeader from './LatestPostHeader';

describe( 'LatestPostHeader', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
	} );

	it( 'should link the post title to the entity dashboard of the post', () => {
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

	it( 'should show the publish date and time in the site time zone, without the year', () => {
		const { getByText } = render(
			<LatestPostHeader
				post={ {
					...LATEST_POST,
					publishedAt: '2026-07-14T18:30:00Z',
					sitePublishedAt: '2026-07-14T14:30:00',
				} }
			/>,
			{ registry }
		);

		expect(
			getByText( /^posted July 14 at 2:30\sPM$/ )
		).toBeInTheDocument();
	} );

	it( 'should show the publish time in the site time zone, rather than the browser time zone, when the site time zone is a UTC offset', () => {
		provideSiteInfo( registry, { timezone: '' } );
		// The browser is on UTC+8, so the browser time would be 3:59 PM.
		const originalTimezone = provideTimezone( 'Asia/Singapore' );

		try {
			const { getByText } = render(
				<LatestPostHeader
					post={ {
						...LATEST_POST,
						publishedAt: '2026-09-17T07:59:00Z',
						sitePublishedAt: '2026-09-17T07:59:00',
					} }
				/>,
				{ registry }
			);

			expect(
				getByText( /^posted September 17 at 7:59\sAM$/ )
			).toBeInTheDocument();
		} finally {
			provideTimezone( originalTimezone );
		}
	} );
} );
