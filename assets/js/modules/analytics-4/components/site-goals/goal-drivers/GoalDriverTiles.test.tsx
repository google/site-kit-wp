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
import { FC } from 'react';

/**
 * Internal dependencies
 */
import { act, fireEvent, render } from '@tests/js/test-utils';
import { getViewportWidth, setViewportWidth } from '@tests/js/viewport-utils';
import { GOAL_DRIVER_IDS, GOAL_TYPES } from './constants';
import GoalDriverTiles from './GoalDriverTiles';
import { GoalDriverComponentProps, GoalDriverTilesDriver } from './types';

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
		loading: false,
	},
	{
		id: GOAL_DRIVER_IDS.TOP_PAGES,
		Component: MockGoalDriver,
		rows: [],
		loading: false,
	},
	{
		id: GOAL_DRIVER_IDS.VISITOR_TYPE,
		Component: MockGoalDriver,
		rows: [],
		loading: false,
	},
	{
		id: GOAL_DRIVER_IDS.CITIES,
		Component: MockGoalDriver,
		rows: [],
		loading: false,
	},
	{
		id: GOAL_DRIVER_IDS.COUNTRIES,
		Component: MockGoalDriver,
		rows: [],
		loading: false,
	},
	{
		id: GOAL_DRIVER_IDS.DEVICE_TYPE,
		Component: MockGoalDriver,
		rows: [],
		loading: false,
	},
];

function getActiveTiles( container: Element ) {
	return container.querySelectorAll(
		'.googlesitekit-site-goals-goal-drivers-section__tile:not(.googlesitekit-site-goals-goal-drivers-section__tile--empty)'
	);
}

function getEmptyTiles( container: Element ) {
	return container.querySelectorAll(
		'.googlesitekit-site-goals-goal-drivers-section__tile--empty'
	);
}

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
				drivers={ drivers.slice( 0, 3 ) }
				goalType={ GOAL_TYPES.LEAD }
				hasExpandableRows
			/>
		);

		expect( getActiveTiles( container ) ).toHaveLength( 3 );
		expect( getEmptyTiles( container ) ).toHaveLength( 0 );
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

		expect( getAllByText( 'rows-limit-6-goal-lead' ) ).toHaveLength( 6 );
		expect(
			getByRole( 'button', { name: /show less/i } )
		).toBeInTheDocument();

		act( () => {
			fireEvent.click( getByRole( 'button', { name: /show less/i } ) );
		} );
		expect( getAllByText( 'rows-limit-3-goal-lead' ) ).toHaveLength( 6 );
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

		expect( getAllByText( 'rows-limit-3-goal-lead' ) ).toHaveLength( 6 );
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
		expect( getAllByText( 'rows-limit-3-goal-lead' ) ).toHaveLength( 6 );
	} );

	it( 'renders two empty slots for four drivers', () => {
		const { container } = render(
			<GoalDriverTiles
				drivers={ drivers.slice( 0, 4 ) }
				goalType={ GOAL_TYPES.LEAD }
				hasExpandableRows
			/>
		);

		expect( getActiveTiles( container ) ).toHaveLength( 4 );
		expect( getEmptyTiles( container ) ).toHaveLength( 2 );

		const tileElements = Array.from(
			container.querySelectorAll(
				'.googlesitekit-site-goals-goal-drivers-section__tile'
			)
		);
		const firstEmptyTileIndex = tileElements.findIndex( ( tile ) =>
			tile.classList.contains(
				'googlesitekit-site-goals-goal-drivers-section__tile--empty'
			)
		);

		expect( firstEmptyTileIndex ).toBe( 4 );
	} );

	it( 'renders one empty slot for five drivers', () => {
		const { container } = render(
			<GoalDriverTiles
				drivers={ drivers.slice( 0, 5 ) }
				goalType={ GOAL_TYPES.LEAD }
				hasExpandableRows
			/>
		);

		expect( getActiveTiles( container ) ).toHaveLength( 5 );
		expect( getEmptyTiles( container ) ).toHaveLength( 1 );
	} );

	it( 'renders no empty slots for six drivers', () => {
		const { container } = render(
			<GoalDriverTiles
				drivers={ drivers }
				goalType={ GOAL_TYPES.LEAD }
				hasExpandableRows
			/>
		);

		expect( getActiveTiles( container ) ).toHaveLength( 6 );
		expect( getEmptyTiles( container ) ).toHaveLength( 0 );
	} );
} );
