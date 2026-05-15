/**
 * GoalDriverTiles component tests.
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
 * External dependencies
 */
import type { FC } from 'react';

/**
 * Internal dependencies
 */
import {
	act,
	fireEvent,
	render,
} from '../../../../../../../tests/js/test-utils';
import {
	getViewportWidth,
	setViewportWidth,
} from '../../../../../../../tests/js/viewport-utils';
import { GOAL_DRIVER_IDS, GOAL_TYPES } from './constants';
import GoalDriverTiles from './GoalDriverTiles';
import type { GoalDriverComponentProps, GoalDriverTilesDriver } from './types';

const MockGoalDriver: FC< GoalDriverComponentProps > = ( {
	limit,
	goalType,
} ) => {
	return <div>{ `rows-limit-${ limit }-goal-${ goalType }` }</div>;
};

const drivers: GoalDriverTilesDriver[] = [
	{
		id: GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS,
		Component: MockGoalDriver,
		rows: [],
		totalRows: 6,
		loading: false,
	},
	{
		id: GOAL_DRIVER_IDS.TOP_PAGES,
		Component: MockGoalDriver,
		rows: [],
		totalRows: 4,
		loading: false,
	},
	{
		id: GOAL_DRIVER_IDS.VISITOR_TYPE,
		Component: MockGoalDriver,
		rows: [],
		totalRows: 2,
		loading: false,
	},
];

describe( 'GoalDriverTiles', () => {
	let originalViewportWidth: number;

	beforeEach( () => {
		originalViewportWidth = getViewportWidth();
		setViewportWidth( 1024 );
	} );

	afterEach( () => {
		setViewportWidth( originalViewportWidth );
	} );

	it( 'renders one row with three tiles and defaults to 3 rows', () => {
		const { container, getAllByText } = render(
			<GoalDriverTiles
				drivers={ drivers }
				goalType={ GOAL_TYPES.LEAD }
				hasExpandableRows
			/>
		);

		expect(
			container.querySelectorAll(
				'.googlesitekit-site-goals-goal-drivers-section__tile'
			)
		).toHaveLength( 3 );

		expect( getAllByText( 'rows-limit-3-goal-lead' ) ).toHaveLength( 3 );
	} );

	it( 'toggles all tiles between 3 and 6 rows', () => {
		const { getByRole, getAllByText } = render(
			<GoalDriverTiles
				drivers={ drivers }
				goalType={ GOAL_TYPES.LEAD }
				hasExpandableRows
			/>
		);

		act( () => {
			fireEvent.click( getByRole( 'button', { name: /show more/i } ) );
		} );

		expect( getAllByText( 'rows-limit-6-goal-lead' ) ).toHaveLength( 3 );
		expect(
			getByRole( 'button', { name: /show less/i } )
		).toBeInTheDocument();

		act( () => {
			fireEvent.click( getByRole( 'button', { name: /show less/i } ) );
		} );
		expect( getAllByText( 'rows-limit-3-goal-lead' ) ).toHaveLength( 3 );
	} );

	it( 'does not render "Show more" when no expandable rows exist', () => {
		const { queryByRole } = render(
			<GoalDriverTiles
				drivers={ drivers }
				hasExpandableRows={ false }
				goalType={ GOAL_TYPES.LEAD }
			/>
		);

		expect(
			queryByRole( 'button', { name: /show more/i } )
		).not.toBeInTheDocument();
	} );

	it( 'passes goalType through to driver components', () => {
		const { getAllByText } = render(
			<GoalDriverTiles
				drivers={ drivers }
				goalType={ GOAL_TYPES.LEAD }
				hasExpandableRows
			/>
		);

		expect( getAllByText( 'rows-limit-3-goal-lead' ) ).toHaveLength( 3 );
	} );

	it( 'hides "Show more" on mobile and keeps tiles at 3 rows', () => {
		setViewportWidth( 600 );

		const { queryByRole, getAllByText } = render(
			<GoalDriverTiles
				drivers={ drivers }
				goalType={ GOAL_TYPES.LEAD }
				hasExpandableRows
			/>
		);

		expect(
			queryByRole( 'button', { name: /show more/i } )
		).not.toBeInTheDocument();
		expect( getAllByText( 'rows-limit-3-goal-lead' ) ).toHaveLength( 3 );
	} );
} );
