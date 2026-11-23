/**
 * Traffic Overview chart legend tests.
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
import { render } from '@tests/js/test-utils';
import ChartLegend from './ChartLegend';

describe( 'ChartLegend', () => {
	it( "shows each item as a label beside a line in the item's color", () => {
		const { getAllByRole } = render(
			<ChartLegend
				items={ [
					{ label: 'Last 28 days traffic', color: '#462083' },
					{ label: 'Previous 28 days traffic', color: '#b8bdb9' },
				] }
			/>
		);

		const [ firstItem, secondItem ] = getAllByRole( 'listitem' );

		expect( firstItem ).toHaveTextContent( 'Last 28 days traffic' );
		expect(
			firstItem.querySelector(
				'.googlesitekit-traffic-overview__chart-legend-line'
			)
		).toHaveStyle( { backgroundColor: '#462083' } );

		expect( secondItem ).toHaveTextContent( 'Previous 28 days traffic' );
		expect(
			secondItem.querySelector(
				'.googlesitekit-traffic-overview__chart-legend-line'
			)
		).toHaveStyle( { backgroundColor: '#b8bdb9' } );
	} );
} );
