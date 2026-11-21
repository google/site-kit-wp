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
import { render, within } from '@tests/js/test-utils';
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

	it( "should show an item's color in a block for an area, and in a dot for a point", () => {
		const { getAllByRole } = render(
			<ChartLegend
				items={ [
					{
						label: 'Typical traffic range',
						color: '#e3d1ff',
						swatch: 'area',
					},
					{
						label: 'Published post',
						color: '#a983e6',
						swatch: 'dot',
					},
				] }
			/>
		);

		const [ areaItem, dotItem ] = getAllByRole( 'listitem' );

		expect(
			areaItem.querySelector(
				'.googlesitekit-traffic-overview__chart-legend-area'
			)
		).toHaveStyle( { backgroundColor: '#e3d1ff' } );
		expect(
			dotItem.querySelector(
				'.googlesitekit-traffic-overview__chart-legend-dot'
			)
		).toHaveStyle( { backgroundColor: '#a983e6' } );
	} );

	it( 'should show an info icon named by the item\'s info, then a "Beta" badge, after the label', () => {
		const { getByRole } = render(
			<ChartLegend
				items={ [
					{
						label: 'Typical traffic range',
						color: '#e3d1ff',
						swatch: 'area',
						info: 'The range of visits that is typical for each day.',
						isBeta: true,
					},
				] }
			/>
		);

		const item = getByRole( 'listitem' );

		expect(
			within( item ).getByRole( 'button', {
				name: 'The range of visits that is typical for each day.',
			} )
		).toBeInTheDocument();
		expect( within( item ).getByText( 'Beta' ) ).toHaveClass(
			'googlesitekit-badge'
		);
	} );

	it( 'should show no info icon and no "Beta" badge for an item without them', () => {
		const { queryByRole, queryByText } = render(
			<ChartLegend
				items={ [
					{ label: 'Last 28 days traffic', color: '#462083' },
				] }
			/>
		);

		expect( queryByRole( 'button' ) ).not.toBeInTheDocument();
		expect( queryByText( 'Beta' ) ).not.toBeInTheDocument();
	} );
} );
