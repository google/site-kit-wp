/**
 * Recent activity zero data tests.
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
import { render, screen } from '@tests/js/test-utils';
import RecentActivityZeroData from './RecentActivityZeroData';

describe( 'RecentActivityZeroData', () => {
	it( 'should render "No recent activity data found" as a heading, over the two sentences about when to expect data, with no link', () => {
		const { container } = render( <RecentActivityZeroData /> );

		expect(
			screen.getByRole( 'heading', {
				name: 'No recent activity data found',
			} )
		).toBeInTheDocument();
		expect( container ).toHaveTextContent(
			'We haven’t received new visitor or search data yet. It can take up to 6 hours to arrive, so check back soon.'
		);
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it( 'should render an illustration', () => {
		const { container } = render( <RecentActivityZeroData /> );

		expect(
			container.querySelector(
				'.googlesitekit-traffic-overview__recent-activity-message-illustration svg'
			)
		).toBeInTheDocument();
	} );
} );
