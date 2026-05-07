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
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import type {
	GoalDriverTilesDriver,
	GoalType,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';

interface GoalDriverTilesProps {
	drivers?: GoalDriverTilesDriver[];
	hasExpandableRows?: boolean;
	goalType: GoalType;
}

const GoalDriverTiles: FC< GoalDriverTilesProps > = ( {
	drivers = [],
	hasExpandableRows = false,
	goalType,
} ) => {
	const breakpoint = useBreakpoint();
	const isMobileBreakpoint = breakpoint === BREAKPOINT_SMALL;
	const [ isExpanded, setIsExpanded ] = useState( false );

	const onShowMoreClick = useCallback( () => {
		setIsExpanded( ( currentState ) => ! currentState );
	}, [] );

	const limit =
		isExpanded && ! isMobileBreakpoint
			? GOAL_DRIVER_ROW_LIMIT_EXPANDED
			: GOAL_DRIVER_ROW_LIMIT_COLLAPSED;

	return (
		<Fragment>
			<div className="googlesitekit-site-goals-goal-drivers-section__tiles">
				{ drivers.map( ( driver ) => {
					const DriverComponent = driver.Component;

					if ( ! DriverComponent ) {
						return null;
					}

					return (
						<div
							key={ driver.id }
							className="googlesitekit-site-goals-goal-drivers-section__tile"
						>
							<DriverComponent
								title={ driver.title }
								rows={ driver.rows }
								totalRows={ driver.totalRows }
								loading={ driver.loading }
								error={ driver.error }
								limit={ limit }
								goalType={ goalType }
							/>
						</div>
					);
				} ) }
			</div>

			{ hasExpandableRows && ! isMobileBreakpoint && (
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
