/**
 * Recent activity message tests.
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
import RecentActivityMessage from './RecentActivityMessage';

describe( 'RecentActivityMessage', () => {
	it( 'should render the illustration, the title as a heading of level 3, and the sentences, in that order', () => {
		const { container } = render(
			<RecentActivityMessage
				className="googlesitekit-traffic-overview__recent-activity-zero-data"
				illustration={ <svg role="img" aria-label="Illustration" /> }
				title="No recent activity data found"
				sentences={ [ 'Data may still be on its way.' ] }
			/>
		);

		expect(
			screen.getByRole( 'heading', {
				level: 3,
				name: 'No recent activity data found',
			} )
		).toBeInTheDocument();
		expect( container.firstChild ).toHaveClass(
			'googlesitekit-traffic-overview__recent-activity-message',
			'googlesitekit-traffic-overview__recent-activity-zero-data'
		);
		expect( container.firstChild ).toHaveTextContent(
			'No recent activity data foundData may still be on its way.'
		);
		expect(
			screen
				.getByRole( 'img', { name: 'Illustration' } )
				.compareDocumentPosition(
					screen.getByRole( 'heading', { level: 3 } )
				)
		).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
	} );

	it( 'should separate the sentences with a space', () => {
		const { container } = render(
			<RecentActivityMessage
				illustration={ <svg /> }
				title="No recent activity data found"
				sentences={ [
					'We can’t access your traffic data.',
					'Try refreshing or get help',
				] }
			/>
		);

		expect( container ).toHaveTextContent(
			'We can’t access your traffic data. Try refreshing or get help'
		);
	} );
} );
