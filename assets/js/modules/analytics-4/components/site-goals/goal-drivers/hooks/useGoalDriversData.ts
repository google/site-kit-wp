/**
 * UseGoalDriversData hook.
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
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	GOAL_DRIVER_CATALOG,
	resolveGoalDriverIDs,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/registry';
import useTopTrafficChannelsGoalDriverData from '@/js/modules/analytics-4/components/site-goals/goal-drivers/hooks/useTopTrafficChannelsGoalDriverData';
import useTopPagesGoalDriverData from '@/js/modules/analytics-4/components/site-goals/goal-drivers/hooks/useTopPagesGoalDriverData';
import useVisitorTypeGoalDriverData from '@/js/modules/analytics-4/components/site-goals/goal-drivers/hooks/useVisitorTypeGoalDriverData';
import type {
	GoalDriverData,
	GoalDriverCatalogEntry,
	GoalDriverTilesDriver,
	UseGoalDriversDataArgs,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';

type CombinedGoalDriver = GoalDriverData & GoalDriverCatalogEntry;

export default function useGoalDriversData( {
	goalType,
	primaryEvent,
	selectedDriverIDs,
}: UseGoalDriversDataArgs ) {
	const topTrafficChannels = useTopTrafficChannelsGoalDriverData( {
		goalType,
		primaryEvent,
	} );
	const topPages = useTopPagesGoalDriverData( {
		goalType,
		primaryEvent,
	} );
	const visitorType = useVisitorTypeGoalDriverData( {
		goalType,
		primaryEvent,
	} );

	const activeDriverIDs = useMemo(
		() => resolveGoalDriverIDs( selectedDriverIDs ),
		[ selectedDriverIDs ]
	);

	const dataByID: Record< GoalDriverData[ 'id' ], GoalDriverData > = useMemo(
		() => ( {
			topTrafficChannels,
			topPages,
			visitorType,
		} ),
		[ topPages, topTrafficChannels, visitorType ]
	);

	const drivers: GoalDriverTilesDriver[] = useMemo(
		() =>
			activeDriverIDs
				.map( ( driverID ) => {
					const metadata = GOAL_DRIVER_CATALOG[ driverID ];
					const data = dataByID[ driverID ];

					if ( ! metadata || ! data ) {
						return null;
					}

					return {
						...metadata,
						...data,
					};
				} )
				.filter(
					( driver ): driver is CombinedGoalDriver => driver !== null
				),
		[ activeDriverIDs, dataByID ]
	);

	const loading = drivers.some( ( driver ) => driver.loading );
	const error = drivers.find( ( driver ) => !! driver.error )?.error;
	const hasExpandableRows = drivers.some(
		( driver ) => driver.totalRows > 3
	);

	return {
		drivers,
		loading,
		error,
		hasExpandableRows,
	};
}
