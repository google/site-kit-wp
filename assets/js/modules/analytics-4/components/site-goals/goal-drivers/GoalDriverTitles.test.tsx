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
import TopPagesGoalDriver from './TopPagesGoalDriver';
import VisitorTypeGoalDriver from './VisitorTypeGoalDriver';

const rows = [ { label: 'Direct', value: '60%' } ];

describe( 'Goal driver titles', () => {
	it( 'renders Top traffic channels title based on goal type', () => {
		const { getByText, queryByText, rerender } = render(
			<TopTrafficChannelsGoalDriver goalType="lead" rows={ rows } />
		);
		expect(
			getByText( 'Top traffic channels driving leads' )
		).toBeInTheDocument();

		rerender(
			<TopTrafficChannelsGoalDriver goalType="ecommerce" rows={ rows } />
		);

		expect(
			getByText( 'Top traffic channels driving sales' )
		).toBeInTheDocument();
		expect(
			queryByText( 'Top traffic channels driving leads' )
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
