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
import TopPagesGoalDriver from './TopPagesGoalDriver';
import TopTrafficChannelsGoalDriver from './TopTrafficChannelsGoalDriver';
import VisitorTypeGoalDriver from './VisitorTypeGoalDriver';

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
		const { getByText } = render(
			<TopTrafficChannelsGoalDriver
				goalType={ GOAL_TYPES.LEAD }
				rows={ rows }
				title="Top traffic channels driving leads"
			/>
		);

		expect(
			getByText( 'Top traffic channels driving leads' )
		).toBeInTheDocument();
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
