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
import {
	SITE_GOALS_DEFAULT_SELECTED_DRIVERS,
	SITE_GOALS_MAX_SELECTED_DRIVERS,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import CitiesGoalDriver from '@/js/modules/analytics-4/components/site-goals/goal-drivers/CitiesGoalDriver';
import {
	GOAL_DRIVER_IDS,
	GOAL_TYPES,
	TOP_AUTHORS_REQUIRED_CUSTOM_DIMENSIONS,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import CountriesGoalDriver from '@/js/modules/analytics-4/components/site-goals/goal-drivers/CountriesGoalDriver';
import DeviceTypeGoalDriver from '@/js/modules/analytics-4/components/site-goals/goal-drivers/DeviceTypeGoalDriver';
import TopAuthorsGoalDriver from '@/js/modules/analytics-4/components/site-goals/goal-drivers/TopAuthorsGoalDriver';
import TopPagesGoalDriver from '@/js/modules/analytics-4/components/site-goals/goal-drivers/TopPagesGoalDriver';
import TopTrafficChannelsGoalDriver from '@/js/modules/analytics-4/components/site-goals/goal-drivers/TopTrafficChannelsGoalDriver';
import TopTrafficChannelsRateGoalDriver from '@/js/modules/analytics-4/components/site-goals/goal-drivers/TopTrafficChannelsRateGoalDriver';
import {
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
					'Top traffic channels by total sales',
					'google-site-kit'
				),
				description: __(
					'Where do most of your buyers come from?',
					'google-site-kit'
				),
			},
			[ GOAL_TYPES.LEAD ]: {
				title: __(
					'Top traffic channels by total form completions',
					'google-site-kit'
				),
				description: __(
					'Where do most of your leads come from?',
					'google-site-kit'
				),
			},
		},
		Component: TopTrafficChannelsGoalDriver,
	},
	[ GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS_RATE ]: {
		id: GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS_RATE,
		order: 10,
		defaultEnabled: true,
		copyByGoalType: {
			[ GOAL_TYPES.ECOMMERCE ]: {
				title: __(
					'Top traffic channels by sales rate',
					'google-site-kit'
				),
				description: __(
					'Which channels have the highest percentage of buyers?',
					'google-site-kit'
				),
			},
			[ GOAL_TYPES.LEAD ]: {
				title: __(
					'Top traffic channels by form completion rate',
					'google-site-kit'
				),
				description: __(
					'Which channels are most efficient at capturing leads?',
					'google-site-kit'
				),
			},
		},
		Component: TopTrafficChannelsRateGoalDriver,
	},
	[ GOAL_DRIVER_IDS.TOP_PAGES ]: {
		id: GOAL_DRIVER_IDS.TOP_PAGES,
		order: 10,
		defaultEnabled: false,
		copyByGoalType: {
			[ GOAL_TYPES.ECOMMERCE ]: {
				title: __( 'Top pages driving sales', 'google-site-kit' ),
				description: __(
					'Which pages bring in the most sales?',
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
	[ GOAL_DRIVER_IDS.TOP_AUTHORS ]: {
		id: GOAL_DRIVER_IDS.TOP_AUTHORS,
		order: 10,
		defaultEnabled: false,
		copyByGoalType: {
			[ GOAL_TYPES.ECOMMERCE ]: {
				title: __( 'Top authors driving sales', 'google-site-kit' ),
				description: __(
					'Whose content is best at converting buyers?',
					'google-site-kit'
				),
			},
			[ GOAL_TYPES.LEAD ]: {
				title: __( 'Top authors driving leads', 'google-site-kit' ),
				description: __(
					'Whose content is best at converting readers?',
					'google-site-kit'
				),
			},
		},
		Component: TopAuthorsGoalDriver,
		requiredCustomDimensions: TOP_AUTHORS_REQUIRED_CUSTOM_DIMENSIONS,
	},
	[ GOAL_DRIVER_IDS.VISITOR_TYPE ]: {
		id: GOAL_DRIVER_IDS.VISITOR_TYPE,
		order: 10,
		defaultEnabled: false,
		copyByGoalType: {
			[ GOAL_TYPES.ECOMMERCE ]: {
				title: __( 'Sales by visitor type', 'google-site-kit' ),
				description: __(
					'Which types of visitors are most likely to buy?',
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
	[ GOAL_DRIVER_IDS.CITIES ]: {
		id: GOAL_DRIVER_IDS.CITIES,
		order: 10,
		defaultEnabled: true,
		copyByGoalType: {
			[ GOAL_TYPES.ECOMMERCE ]: {
				title: __( 'Sales by cities', 'google-site-kit' ),
				description: __(
					'Which cities bring in the most buyers?',
					'google-site-kit'
				),
			},
			[ GOAL_TYPES.LEAD ]: {
				title: __( 'Leads by cities', 'google-site-kit' ),
				description: __(
					'Which cities are people reaching out from?',
					'google-site-kit'
				),
			},
		},
		Component: CitiesGoalDriver,
	},
	[ GOAL_DRIVER_IDS.COUNTRIES ]: {
		id: GOAL_DRIVER_IDS.COUNTRIES,
		order: 10,
		defaultEnabled: false,
		copyByGoalType: {
			[ GOAL_TYPES.ECOMMERCE ]: {
				title: __( 'Sales by countries', 'google-site-kit' ),
				description: __(
					'Which countries bring in the most buyers?',
					'google-site-kit'
				),
			},
			[ GOAL_TYPES.LEAD ]: {
				title: __( 'Leads by countries', 'google-site-kit' ),
				description: __(
					'Which countries are people reaching out from?',
					'google-site-kit'
				),
			},
		},
		Component: CountriesGoalDriver,
	},
	[ GOAL_DRIVER_IDS.DEVICE_TYPE ]: {
		id: GOAL_DRIVER_IDS.DEVICE_TYPE,
		order: 10,
		defaultEnabled: false,
		copyByGoalType: {
			[ GOAL_TYPES.ECOMMERCE ]: {
				title: __( 'Sales by device type', 'google-site-kit' ),
				description: __(
					'Are people buying more on mobile or desktop?',
					'google-site-kit'
				),
			},
			[ GOAL_TYPES.LEAD ]: {
				title: __( 'Leads by device type', 'google-site-kit' ),
				description: __(
					'What devices do people use when they take action?',
					'google-site-kit'
				),
			},
		},
		Component: DeviceTypeGoalDriver,
	},
};

const GOAL_DRIVER_ID_SET = new Set( Object.keys( GOAL_DRIVER_CATALOG ) );

function isGoalDriverID( id: string ): id is GoalDriverID {
	return GOAL_DRIVER_ID_SET.has( id );
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
	const defaultDriverIDs = Object.values( GOAL_DRIVER_CATALOG )
		.filter( ( goalDriver ) => goalDriver.defaultEnabled )
		.sort(
			( currentGoalDriver, nextGoalDriver ) =>
				currentGoalDriver.order - nextGoalDriver.order
		)
		.map( ( goalDriver ) => goalDriver.id )
		.slice( 0, SITE_GOALS_MAX_SELECTED_DRIVERS );

	if ( defaultDriverIDs.length ) {
		return defaultDriverIDs;
	}

	return resolveGoalDriverIDs(
		SITE_GOALS_DEFAULT_SELECTED_DRIVERS[ goalType ],
		goalType
	);
}

export function getGoalDriverOptions( goalType: GoalType ): GoalDriverOption[] {
	return getGoalDriverEntriesForType( goalType )
		.map( ( goalDriver ) => {
			const content = getGoalDriverContent( goalType, goalDriver.id );

			if ( ! content ) {
				return null;
			}

			const option: GoalDriverOption = {
				id: goalDriver.id,
				order: goalDriver.order,
				title: content.title,
				description: content.description,
			};

			if ( goalDriver.requiredCustomDimensions ) {
				option.requiredCustomDimensions =
					goalDriver.requiredCustomDimensions;
			}

			return option;
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

	const validSelectedIDs: GoalDriverID[] = [];

	selectedDriverIDs.forEach( ( selectedDriverID ) => {
		if (
			typeof selectedDriverID === 'string' &&
			isGoalDriverID( selectedDriverID ) &&
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
	const selectionState =
		selectedDrivers || SITE_GOALS_DEFAULT_SELECTED_DRIVERS;
	const ecommerceSelection = selectionState?.[ GOAL_TYPES.ECOMMERCE ];
	const leadSelection = selectionState?.[ GOAL_TYPES.LEAD ];

	return {
		[ GOAL_TYPES.ECOMMERCE ]:
			ecommerceSelection !== undefined
				? resolveGoalDriverIDs(
						ecommerceSelection,
						GOAL_TYPES.ECOMMERCE
				  )
				: resolveGoalDriverIDs( undefined, GOAL_TYPES.ECOMMERCE ),
		[ GOAL_TYPES.LEAD ]:
			leadSelection !== undefined
				? resolveGoalDriverIDs( leadSelection, GOAL_TYPES.LEAD )
				: resolveGoalDriverIDs( undefined, GOAL_TYPES.LEAD ),
	};
}
