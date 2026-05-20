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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SITE_GOALS_MAX_SELECTED_DRIVERS } from '@/js/modules/analytics-4/components/site-goals/constants';
import {
	GOAL_DRIVER_IDS,
	GOAL_TYPES,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import TopPagesGoalDriver from '@/js/modules/analytics-4/components/site-goals/goal-drivers/TopPagesGoalDriver';
import TopTrafficChannelsGoalDriver from '@/js/modules/analytics-4/components/site-goals/goal-drivers/TopTrafficChannelsGoalDriver';
import type {
	GoalDriverCatalog,
	GoalDriverContent,
	GoalDriverID,
	GoalDriverOption,
	GoalDriverSelectionState,
	GoalType,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import VisitorTypeGoalDriver from '@/js/modules/analytics-4/components/site-goals/goal-drivers/VisitorTypeGoalDriver';

export const GOAL_DRIVER_CATALOG: GoalDriverCatalog = {
	[ GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS ]: {
		id: GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS,
		order: 10,
		defaultEnabled: true,
		copyByGoalType: {
			[ GOAL_TYPES.ECOMMERCE ]: {
				title: __(
					'Top traffic channels driving sales',
					'google-site-kit'
				),
				description: __(
					'Find out where your online store sales come from.',
					'google-site-kit'
				),
			},
			[ GOAL_TYPES.LEAD ]: {
				title: __(
					'Top traffic channels driving leads',
					'google-site-kit'
				),
				description: __(
					'How did visitors who reached out find your site?',
					'google-site-kit'
				),
			},
		},
		Component: TopTrafficChannelsGoalDriver,
	},
	[ GOAL_DRIVER_IDS.TOP_PAGES ]: {
		id: GOAL_DRIVER_IDS.TOP_PAGES,
		order: 20,
		defaultEnabled: true,
		copyByGoalType: {
			[ GOAL_TYPES.ECOMMERCE ]: {
				title: __( 'Top pages driving sales', 'google-site-kit' ),
				description: __(
					'Identify the pages generating the most sales events.',
					'google-site-kit'
				),
			},
			[ GOAL_TYPES.LEAD ]: {
				title: __( 'Top pages driving leads', 'google-site-kit' ),
				description: __(
					'Which pages get people to take action?',
					'google-site-kit'
				),
			},
		},
		Component: TopPagesGoalDriver,
	},
	[ GOAL_DRIVER_IDS.VISITOR_TYPE ]: {
		id: GOAL_DRIVER_IDS.VISITOR_TYPE,
		order: 30,
		defaultEnabled: true,
		copyByGoalType: {
			[ GOAL_TYPES.ECOMMERCE ]: {
				title: __( 'Sales by visitor type', 'google-site-kit' ),
				description: __(
					'Compare sales from new and returning visitors.',
					'google-site-kit'
				),
			},
			[ GOAL_TYPES.LEAD ]: {
				title: __( 'Leads by visitor type', 'google-site-kit' ),
				description: __(
					'Which types of visitors are most likely to reach out?',
					'google-site-kit'
				),
			},
		},
		Component: VisitorTypeGoalDriver,
	},
};

function isGoalDriverID( id: string ): id is GoalDriverID {
	return GOAL_DRIVER_CATALOG[ id as GoalDriverID ] !== undefined;
}

export function getGoalDriverContent(
	goalType: GoalType,
	driverID: GoalDriverID
): GoalDriverContent | undefined {
	return GOAL_DRIVER_CATALOG[ driverID ].copyByGoalType[ goalType ];
}

export function getGoalTypeDriverIDs( goalType: GoalType ): GoalDriverID[] {
	return Object.values( GOAL_DRIVER_CATALOG )
		.filter( ( goalDriver ) =>
			Boolean( goalDriver.copyByGoalType[ goalType ] )
		)
		.sort(
			( currentGoalDriver, nextGoalDriver ) =>
				currentGoalDriver.order - nextGoalDriver.order
		)
		.map( ( goalDriver ) => goalDriver.id );
}

function getGoalDriverEntriesForType( goalType: GoalType ) {
	return Object.values( GOAL_DRIVER_CATALOG )
		.filter( ( goalDriver ) =>
			Boolean( goalDriver.copyByGoalType[ goalType ] )
		)
		.sort(
			( currentGoalDriver, nextGoalDriver ) =>
				currentGoalDriver.order - nextGoalDriver.order
		);
}

function getDefaultGoalDriverIDs( goalType: GoalType ): GoalDriverID[] {
	return getGoalDriverEntriesForType( goalType )
		.filter( ( goalDriver ) => goalDriver.defaultEnabled )
		.map( ( goalDriver ) => goalDriver.id )
		.slice( 0, SITE_GOALS_MAX_SELECTED_DRIVERS );
}

export function getGoalDriverOptions( goalType: GoalType ): GoalDriverOption[] {
	return getGoalDriverEntriesForType( goalType )
		.map( ( goalDriver ) => {
			const content = getGoalDriverContent( goalType, goalDriver.id );

			if ( ! content ) {
				return null;
			}

			return {
				id: goalDriver.id,
				order: goalDriver.order,
				title: content.title,
				description: content.description,
			};
		} )
		.filter( ( goalDriverOption ): goalDriverOption is GoalDriverOption =>
			Boolean( goalDriverOption )
		);
}

export function getGoalDriverTitle(
	goalType: GoalType,
	driverID: GoalDriverID
): string | undefined {
	return getGoalDriverContent( goalType, driverID )?.title;
}

export function resolveGoalDriverIDs(
	selectedDriverIDs: string[] | undefined = undefined,
	goalType: GoalType = GOAL_TYPES.ECOMMERCE
): GoalDriverID[] {
	if ( selectedDriverIDs === undefined ) {
		return getDefaultGoalDriverIDs( goalType );
	}

	if ( ! selectedDriverIDs.length ) {
		return [];
	}

	const availableIDs = getGoalTypeDriverIDs( goalType );

	const validSelectedIDs: GoalDriverID[] = [];

	selectedDriverIDs.forEach( ( selectedDriverID ) => {
		if (
			typeof selectedDriverID === 'string' &&
			isGoalDriverID( selectedDriverID ) &&
			availableIDs.includes( selectedDriverID ) &&
			! validSelectedIDs.includes( selectedDriverID )
		) {
			validSelectedIDs.push( selectedDriverID );
		}
	} );

	return validSelectedIDs.slice( 0, SITE_GOALS_MAX_SELECTED_DRIVERS );
}

export function resolveGoalDriverSelectionState( selectedDrivers?: {
	[ key: string ]: string[];
} ): GoalDriverSelectionState {
	const ecommerceSelection = selectedDrivers?.[ GOAL_TYPES.ECOMMERCE ];
	const leadSelection = selectedDrivers?.[ GOAL_TYPES.LEAD ];

	return {
		[ GOAL_TYPES.ECOMMERCE ]:
			ecommerceSelection !== undefined
				? resolveGoalDriverIDs(
						ecommerceSelection,
						GOAL_TYPES.ECOMMERCE
				  )
				: getDefaultGoalDriverIDs( GOAL_TYPES.ECOMMERCE ),
		[ GOAL_TYPES.LEAD ]:
			leadSelection !== undefined
				? resolveGoalDriverIDs( leadSelection, GOAL_TYPES.LEAD )
				: getDefaultGoalDriverIDs( GOAL_TYPES.LEAD ),
	};
}
