/**
 * Site Goals Goal Drivers registry.
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
import TopTrafficChannelsGoalDriver from '@/js/modules/analytics-4/components/site-goals/goal-drivers/TopTrafficChannelsGoalDriver';
import TopPagesGoalDriver from '@/js/modules/analytics-4/components/site-goals/goal-drivers/TopPagesGoalDriver';
import VisitorTypeGoalDriver from '@/js/modules/analytics-4/components/site-goals/goal-drivers/VisitorTypeGoalDriver';
import { GOAL_DRIVER_IDS } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import type {
	GoalDriverCatalog,
	GoalDriverID,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';

export const GOAL_DRIVER_CATALOG = {
	[ GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS ]: {
		id: GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS,
		order: 10,
		defaultEnabled: true,
		Component: TopTrafficChannelsGoalDriver,
	},
	[ GOAL_DRIVER_IDS.TOP_PAGES ]: {
		id: GOAL_DRIVER_IDS.TOP_PAGES,
		order: 20,
		defaultEnabled: true,
		Component: TopPagesGoalDriver,
	},
	[ GOAL_DRIVER_IDS.VISITOR_TYPE ]: {
		id: GOAL_DRIVER_IDS.VISITOR_TYPE,
		order: 30,
		defaultEnabled: true,
		Component: VisitorTypeGoalDriver,
	},
} as GoalDriverCatalog;

function isGoalDriverID( id: string ): id is GoalDriverID {
	return GOAL_DRIVER_CATALOG[ id as GoalDriverID ] !== undefined;
}

function getDefaultGoalDriverIDs(): GoalDriverID[] {
	return Object.values( GOAL_DRIVER_CATALOG )
		.filter( ( goalDriver ) => goalDriver.defaultEnabled )
		.sort(
			( currentGoalDriver, nextGoalDriver ) =>
				currentGoalDriver.order - nextGoalDriver.order
		)
		.map( ( goalDriver ) => goalDriver.id );
}

export function resolveGoalDriverIDs(
	selectedDriverIDs: string[] = []
): GoalDriverID[] {
	if ( ! Array.isArray( selectedDriverIDs ) || ! selectedDriverIDs.length ) {
		return getDefaultGoalDriverIDs();
	}

	const validSelectedIDs = selectedDriverIDs.filter( isGoalDriverID );

	if ( ! validSelectedIDs.length ) {
		return getDefaultGoalDriverIDs();
	}

	return validSelectedIDs;
}
