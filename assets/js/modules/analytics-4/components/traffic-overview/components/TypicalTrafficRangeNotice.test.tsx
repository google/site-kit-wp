/**
 * TypicalTrafficRangeNotice component tests.
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { render } from '@tests/js/test-utils';
import { createTestRegistry } from '@tests/js/utils';
import TypicalTrafficRangeNotice, {
	TypicalTrafficRangeNoticeProps,
} from './TypicalTrafficRangeNotice';

/**
 * Renders the notice with `2025-02-05` as today.
 *
 * @since n.e.x.t
 *
 * @param {Object} props The notice's props.
 * @return {Object} The render result.
 */
function renderNotice( props: TypicalTrafficRangeNoticeProps ) {
	const registry = createTestRegistry();
	registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );

	return render( <TypicalTrafficRangeNotice { ...props } />, { registry } );
}

describe( 'TypicalTrafficRangeNotice', () => {
	it( 'should say when the typical traffic range will show while the days of the selected range have none', () => {
		const { container, getByText } = renderNotice( {
			bandAvailable: false,
			availableFrom: '2025-04-02',
		} );

		expect(
			getByText(
				'We’re still learning what’s usual for your site. Check back on April 2, 2025 to see your typical traffic range.'
			)
		).toBeInTheDocument();
		expect(
			container.querySelector(
				'.googlesitekit-traffic-overview__band-notice'
			)
		).toBeInTheDocument();
	} );

	it.each( [
		[ 'when every day has its typical range', { bandAvailable: true } ],
		[
			'while the panel’s figures load',
			{
				bandAvailable: false,
				availableFrom: '2025-04-02',
				loaded: false,
			},
		],
	] )( 'should render nothing %s', ( _, props ) => {
		const { container } = renderNotice( props );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
