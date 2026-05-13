/**
 * GoalDriverTiles component.
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
 * WordPress dependencies
 */
import { Fragment, useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Link from '@/js/components/Link';
import { BREAKPOINT_SMALL, useBreakpoint } from '@/js/hooks/useBreakpoint';
import {
	GOAL_DRIVER_ROW_LIMIT_COLLAPSED,
	GOAL_DRIVER_ROW_LIMIT_EXPANDED,
} from './constants';
import type {
	GoalDriverComponentProps,
	GoalDriverTilesDriver,
	GoalType,
} from './types';

interface GoalDriverTilesProps {
	drivers?: GoalDriverTilesDriver[];
	hasExpandableRows?: boolean;
	primaryEvent?: string | string[];
	goalType: GoalType;
}

interface RenderableGoalDriver extends GoalDriverTilesDriver {
	Component: FC< GoalDriverComponentProps >;
}

function isRenderableGoalDriver(
	driver: GoalDriverTilesDriver
): driver is RenderableGoalDriver {
	return !! driver.Component;
}

const GoalDriverTiles: FC< GoalDriverTilesProps > = ( {
	drivers = [],
	hasExpandableRows,
	primaryEvent,
	goalType,
} ) => {
	const breakpoint = useBreakpoint();
	const isMobileBreakpoint = breakpoint === BREAKPOINT_SMALL;
	const [ isExpanded, setIsExpanded ] = useState( false );
	const [ expandableDrivers, setExpandableDrivers ] = useState<
		Record< string, boolean >
	>( {} );

	const onShowMoreClick = useCallback( () => {
		setIsExpanded( ( currentState ) => ! currentState );
	}, [] );
	const onExpandableRowsChange = useCallback(
		( driverID: string, canExpand: boolean ) => {
			setExpandableDrivers( ( currentState ) => {
				if ( currentState[ driverID ] === canExpand ) {
					return currentState;
				}

				return {
					...currentState,
					[ driverID ]: canExpand,
				};
			} );
		},
		[]
	);

	const limit =
		isExpanded && ! isMobileBreakpoint
			? GOAL_DRIVER_ROW_LIMIT_EXPANDED
			: GOAL_DRIVER_ROW_LIMIT_COLLAPSED;
	const filteredDrivers = drivers.filter( isRenderableGoalDriver );
	const hasExpandableDrivers =
		typeof hasExpandableRows === 'boolean'
			? hasExpandableRows
			: Object.values( expandableDrivers ).some( Boolean );

	return (
		<Fragment>
			<div className="googlesitekit-site-goals-goal-drivers-section__tiles">
				{ filteredDrivers.map(
					( { Component: DriverComponent, ...driver } ) => (
						<div
							key={ driver.id }
							className="googlesitekit-site-goals-goal-drivers-section__tile"
						>
							<DriverComponent
								goalType={ goalType }
								primaryEvent={ primaryEvent }
								limit={ limit }
								onExpandableRowsChange={
									onExpandableRowsChange
								}
								{ ...driver }
							/>
						</div>
					)
				) }
			</div>

			{ hasExpandableDrivers && ! isMobileBreakpoint && (
				<Link
					className="googlesitekit-site-goals-goal-drivers-section__show-more"
					onClick={ onShowMoreClick }
					linkButton
				>
					{ isExpanded
						? __( 'Show less', 'google-site-kit' )
						: __( 'Show more', 'google-site-kit' ) }
				</Link>
			) }
		</Fragment>
	);
};

export default GoalDriverTiles;
