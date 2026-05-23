/**
 * Site Goals Visitor Engagement registry.
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
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { ENUM_CONVERSION_EVENTS } from '@/js/modules/analytics-4/datastore/constants';

export const VISITOR_ENGAGEMENT_EVENT_IDS = {
	ADD_TO_CART: ENUM_CONVERSION_EVENTS.ADD_TO_CART,
} as const;

export type VisitorEngagementEventID =
	typeof VISITOR_ENGAGEMENT_EVENT_IDS[ keyof typeof VISITOR_ENGAGEMENT_EVENT_IDS ];

export type VisitorEngagementSelectionState = Record<
	GoalType,
	VisitorEngagementEventID[]
>;

export interface VisitorEngagementEvent {
	id: VisitorEngagementEventID;
	order: number;
	defaultEnabled: boolean;
	panelLabel: string;
	tileLabel: string;
	goalTypes: GoalType[];
}

export interface VisitorEngagementOption {
	id: VisitorEngagementEventID;
	order: number;
	title: string;
}

export const VISITOR_ENGAGEMENT_EVENT_CATALOG: Record<
	VisitorEngagementEventID,
	VisitorEngagementEvent
> = {
	[ VISITOR_ENGAGEMENT_EVENT_IDS.ADD_TO_CART ]: {
		id: VISITOR_ENGAGEMENT_EVENT_IDS.ADD_TO_CART,
		order: 10,
		defaultEnabled: true,
		panelLabel: __( 'Products added to cart', 'google-site-kit' ),
		tileLabel: __( 'Products added to cart', 'google-site-kit' ),
		goalTypes: [ GOAL_TYPES.ECOMMERCE ],
	},
};

function isVisitorEngagementEventID(
	eventID: string
): eventID is VisitorEngagementEventID {
	return (
		VISITOR_ENGAGEMENT_EVENT_CATALOG[
			eventID as VisitorEngagementEventID
		] !== undefined
	);
}

function getVisitorEngagementEntries(
	goalType: GoalType
): VisitorEngagementEvent[] {
	return Object.values( VISITOR_ENGAGEMENT_EVENT_CATALOG )
		.filter( ( event ) => event.goalTypes.includes( goalType ) )
		.sort( ( currentEvent, nextEvent ) => {
			return currentEvent.order - nextEvent.order;
		} );
}

export function getVisitorEngagementEventOptions(
	goalType: GoalType
): VisitorEngagementOption[] {
	return getVisitorEngagementEntries( goalType ).map( ( event ) => ( {
		id: event.id,
		order: event.order,
		title: event.panelLabel,
	} ) );
}

export function getVisitorEngagementEventTileLabel(
	eventID: VisitorEngagementEventID
): string {
	return VISITOR_ENGAGEMENT_EVENT_CATALOG[ eventID ].tileLabel;
}

export function resolveVisitorEngagementEventIDs(
	selectedEventIDs: string[] | undefined = undefined,
	goalType: GoalType = GOAL_TYPES.ECOMMERCE
): VisitorEngagementEventID[] {
	const entries = getVisitorEngagementEntries( goalType );

	if ( selectedEventIDs === undefined ) {
		return entries
			.filter( ( event ) => event.defaultEnabled )
			.map( ( event ) => event.id );
	}

	if ( ! selectedEventIDs.length ) {
		return [];
	}

	const selectedSet = new Set(
		selectedEventIDs.filter(
			( eventID ): eventID is VisitorEngagementEventID => {
				return (
					typeof eventID === 'string' &&
					isVisitorEngagementEventID( eventID )
				);
			}
		)
	);

	return entries
		.filter( ( event ) => selectedSet.has( event.id ) )
		.map( ( event ) => event.id );
}

function getSelectedEventsForGoalType(
	selectedEvents: unknown,
	goalType: GoalType
): string[] | undefined {
	if ( ! selectedEvents || typeof selectedEvents !== 'object' ) {
		return undefined;
	}

	const selectedGoalTypeEvents = (
		selectedEvents as Record< string, unknown >
	 )[ goalType ];

	return Array.isArray( selectedGoalTypeEvents )
		? selectedGoalTypeEvents.filter(
				( eventID ): eventID is string => typeof eventID === 'string'
		  )
		: undefined;
}

export function resolveVisitorEngagementSelectionState(
	selectedEvents?: unknown
): VisitorEngagementSelectionState {
	return {
		[ GOAL_TYPES.ECOMMERCE ]: resolveVisitorEngagementEventIDs(
			getSelectedEventsForGoalType(
				selectedEvents,
				GOAL_TYPES.ECOMMERCE
			),
			GOAL_TYPES.ECOMMERCE
		),
		[ GOAL_TYPES.LEAD ]: resolveVisitorEngagementEventIDs(
			getSelectedEventsForGoalType( selectedEvents, GOAL_TYPES.LEAD ),
			GOAL_TYPES.LEAD
		),
	};
}
