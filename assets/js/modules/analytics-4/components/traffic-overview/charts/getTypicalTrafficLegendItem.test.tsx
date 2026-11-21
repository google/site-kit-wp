/**
 * Traffic Overview `getTypicalTrafficLegendItem` utility tests.
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
import { getTypicalTrafficLegendItem } from './getTypicalTrafficLegendItem';

/**
 * Renders the tooltip text of a legend item.
 *
 * @since n.e.x.t
 *
 * @param {Object} item The legend item.
 * @return {string|null} The text of its tooltip.
 */
function getInfoText( item: ReturnType< typeof getTypicalTrafficLegendItem > ) {
	const { container } = render( <div>{ item.info }</div> );

	return container.textContent;
}

describe( 'getTypicalTrafficLegendItem', () => {
	it( 'should return the "Typical traffic range" label, the `#e3d1ff` area color and a "Beta" badge', () => {
		expect( getTypicalTrafficLegendItem( { referenceDays: 364 } ) ).toEqual(
			expect.objectContaining( {
				label: 'Typical traffic range',
				color: '#e3d1ff',
				swatch: 'area',
				isBeta: true,
			} )
		);
	} );

	it( 'should say how many weeks of traffic the range is based on', () => {
		expect(
			getInfoText( getTypicalTrafficLegendItem( { referenceDays: 364 } ) )
		).toBe(
			'Site Kit estimates a typical range from your traffic history, so you can see when visits are higher or lower than expected. Based on 52 weeks of your traffic. Learn more'
		);
	} );

	it.each( [
		// The fewest days a band of 28 days is fitted on.
		[ 83, 11 ],
		[ 84, 12 ],
		// The most days a band is fitted on.
		[ 365, 52 ],
	] )(
		'should name %d days of traffic as %d whole weeks, never more than the band read',
		( referenceDays, weeks ) => {
			expect(
				getInfoText( getTypicalTrafficLegendItem( { referenceDays } ) )
			).toContain( `Based on ${ weeks } weeks of your traffic.` );
		}
	);

	it( 'should mention the same time last year only when the history reaches it', () => {
		expect(
			getInfoText(
				getTypicalTrafficLegendItem( {
					referenceDays: 365,
					lastYearAvailable: true,
				} )
			)
		).toContain(
			'Based on 52 weeks of your traffic, including the same time last year.'
		);

		expect(
			getInfoText(
				getTypicalTrafficLegendItem( {
					referenceDays: 365,
					lastYearAvailable: false,
				} )
			)
		).not.toContain( 'last year' );
	} );

	it( 'should end the tooltip with a "Learn more" link', () => {
		const { getByRole } = render(
			<div>
				{ getTypicalTrafficLegendItem( { referenceDays: 364 } ).info }
			</div>
		);

		expect(
			getByRole( 'link', { name: /Learn more/ } )
		).toBeInTheDocument();
	} );

	it.each( [
		[ 'null', null ],
		[ 'undefined', undefined ],
	] )(
		'should have no tooltip when the days of traffic are %s',
		( _label, referenceDays ) => {
			expect(
				getTypicalTrafficLegendItem( { referenceDays } )
			).not.toHaveProperty( 'info' );
		}
	);
} );
