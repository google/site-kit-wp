/**
 * Goal driver title mapping tests.
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
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { render } from '../../../../../../../tests/js/test-utils';
import { GOAL_DRIVER_IDS, GOAL_TYPES } from './constants';
import { getGoalDriverOptions } from './registry';
import TopTrafficChannelsGoalDriver from './TopTrafficChannelsGoalDriver';
import TopTrafficChannelsRateGoalDriver from './TopTrafficChannelsRateGoalDriver';
import TopPagesGoalDriver from './TopPagesGoalDriver';
import VisitorTypeGoalDriver from './VisitorTypeGoalDriver';
import CitiesGoalDriver from './CitiesGoalDriver';
import CountriesGoalDriver from './CountriesGoalDriver';
import DeviceTypeGoalDriver from './DeviceTypeGoalDriver';

const rows = [ { label: 'Direct', value: '60%' } ];

describe( 'Goal driver titles', () => {
	it( 'returns goal-specific titles for panel and widget usage', () => {
		const ecommerceOptions = getGoalDriverOptions( GOAL_TYPES.ECOMMERCE );
		const leadOptions = getGoalDriverOptions( GOAL_TYPES.LEAD );

		expect( ecommerceOptions ).toContainEqual(
			expect.objectContaining( {
				id: GOAL_DRIVER_IDS.TOP_PAGES,
				title: 'Top pages driving sales',
			} )
		);
		expect( leadOptions ).toContainEqual(
			expect.objectContaining( {
				id: GOAL_DRIVER_IDS.TOP_PAGES,
				title: 'Top pages driving leads',
			} )
		);
	} );

	it( 'renders passed title for top traffic channels', () => {
		const { getByText, queryByText, rerender } = render(
			<TopTrafficChannelsGoalDriver
				goalType={ GOAL_TYPES.LEAD }
				rows={ rows }
				title="Top traffic channels driving leads"
			/>
		);

		expect(
			getByText( 'Top traffic channels by total leads' )
		).toBeInTheDocument();

		rerender(
			<TopTrafficChannelsGoalDriver goalType="ecommerce" rows={ rows } />
		);

		expect(
			getByText( 'Top traffic channels by total sales' )
		).toBeInTheDocument();
		expect(
			queryByText( 'Top traffic channels by total leads' )
		).not.toBeInTheDocument();
	} );

	it( 'renders Top traffic channels rate title based on goal type', () => {
		const { getByText, queryByText, rerender } = render(
			<TopTrafficChannelsRateGoalDriver goalType="lead" rows={ rows } />
		);
		expect(
			getByText( 'Top traffic channels by leads rate' )
		).toBeInTheDocument();

		rerender(
			<TopTrafficChannelsRateGoalDriver
				goalType="ecommerce"
				rows={ rows }
			/>
		);

		expect(
			getByText( 'Top traffic channels by sales rate' )
		).toBeInTheDocument();
		expect(
			queryByText( 'Top traffic channels by leads rate' )
		).not.toBeInTheDocument();
	} );

	it( 'renders passed title for top pages and visitor type', () => {
		const { getByText } = render(
			<Fragment>
				<TopPagesGoalDriver
					goalType={ GOAL_TYPES.LEAD }
					rows={ rows }
					title="Top pages driving leads"
				/>
				<VisitorTypeGoalDriver
					goalType={ GOAL_TYPES.LEAD }
					rows={ rows }
					title="Leads by visitor type"
				/>
			</Fragment>
		);

		expect( getByText( 'Top pages driving leads' ) ).toBeInTheDocument();
		expect( getByText( 'Leads by visitor type' ) ).toBeInTheDocument();
	} );

	it( 'renders Cities title based on goal type', () => {
		const { getByText, queryByText, rerender } = render(
			<CitiesGoalDriver goalType="lead" rows={ rows } />
		);
		expect( getByText( 'Leads by cities' ) ).toBeInTheDocument();

		rerender( <CitiesGoalDriver goalType="ecommerce" rows={ rows } /> );

		expect( getByText( 'Sales by cities' ) ).toBeInTheDocument();
		expect( queryByText( 'Leads by cities' ) ).not.toBeInTheDocument();
	} );

	it( 'renders Countries title based on goal type', () => {
		const { getByText, queryByText, rerender } = render(
			<CountriesGoalDriver goalType="lead" rows={ rows } />
		);
		expect( getByText( 'Leads by countries' ) ).toBeInTheDocument();

		rerender( <CountriesGoalDriver goalType="ecommerce" rows={ rows } /> );

		expect( getByText( 'Sales by countries' ) ).toBeInTheDocument();
		expect( queryByText( 'Leads by countries' ) ).not.toBeInTheDocument();
	} );

	it( 'renders Device type title based on goal type', () => {
		const { getByText, queryByText, rerender } = render(
			<DeviceTypeGoalDriver goalType="lead" rows={ rows } />
		);
		expect( getByText( 'Leads by device type' ) ).toBeInTheDocument();

		rerender( <DeviceTypeGoalDriver goalType="ecommerce" rows={ rows } /> );

		expect( getByText( 'Sales by device type' ) ).toBeInTheDocument();
		expect( queryByText( 'Leads by device type' ) ).not.toBeInTheDocument();
	} );

	it( 'renders zero-data message when no rows are available', () => {
		const { getByText, rerender } = render(
			<TopTrafficChannelsGoalDriver
				goalType={ GOAL_TYPES.LEAD }
				rows={ [] }
				title="Top traffic channels driving leads"
			/>
		);

		expect(
			getByText(
				/No data to display: your site hasn’t received any leads yet/i
			)
		).toBeInTheDocument();

		rerender(
			<TopTrafficChannelsGoalDriver
				goalType={ GOAL_TYPES.ECOMMERCE }
				rows={ [] }
				title="Top traffic channels driving sales"
			/>
		);

		expect(
			getByText(
				/No data to display: your site hasn’t received any sales yet/i
			)
		).toBeInTheDocument();
	} );
} );
