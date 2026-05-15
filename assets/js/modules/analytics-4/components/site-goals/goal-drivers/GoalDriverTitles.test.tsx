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
 * Internal dependencies
 */
import { render } from '../../../../../../../tests/js/test-utils';
import TopTrafficChannelsGoalDriver from './TopTrafficChannelsGoalDriver';
import TopTrafficChannelsRateGoalDriver from './TopTrafficChannelsRateGoalDriver';
import TopPagesGoalDriver from './TopPagesGoalDriver';
import VisitorTypeGoalDriver from './VisitorTypeGoalDriver';
import CitiesGoalDriver from './CitiesGoalDriver';
import CountriesGoalDriver from './CountriesGoalDriver';
import DeviceTypeGoalDriver from './DeviceTypeGoalDriver';

const rows = [ { label: 'Direct', value: '60%' } ];

describe( 'Goal driver titles', () => {
	it( 'renders Top traffic channels title based on goal type', () => {
		const { getByText, queryByText, rerender } = render(
			<TopTrafficChannelsGoalDriver goalType="lead" rows={ rows } />
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

	it( 'renders Top pages title based on goal type', () => {
		const { getByText, queryByText, rerender } = render(
			<TopPagesGoalDriver goalType="lead" rows={ rows } />
		);
		expect( getByText( 'Top pages driving leads' ) ).toBeInTheDocument();

		rerender( <TopPagesGoalDriver goalType="ecommerce" rows={ rows } /> );

		expect( getByText( 'Top pages driving sales' ) ).toBeInTheDocument();
		expect(
			queryByText( 'Top pages driving leads' )
		).not.toBeInTheDocument();
	} );

	it( 'renders Visitor type title based on goal type', () => {
		const { getByText, queryByText, rerender } = render(
			<VisitorTypeGoalDriver goalType="lead" rows={ rows } />
		);
		expect( getByText( 'Leads by visitor type' ) ).toBeInTheDocument();

		rerender(
			<VisitorTypeGoalDriver goalType="ecommerce" rows={ rows } />
		);

		expect( getByText( 'Sales by visitor type' ) ).toBeInTheDocument();
		expect(
			queryByText( 'Leads by visitor type' )
		).not.toBeInTheDocument();
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
			<TopTrafficChannelsGoalDriver goalType="lead" rows={ [] } />
		);

		expect(
			getByText(
				/No data to display: your site hasn’t received any leads yet/i
			)
		).toBeInTheDocument();

		rerender(
			<TopTrafficChannelsGoalDriver goalType="ecommerce" rows={ [] } />
		);

		expect(
			getByText(
				/No data to display: your site hasn’t received any sales yet/i
			)
		).toBeInTheDocument();
	} );
} );
