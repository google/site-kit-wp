/**
 * Site Goals Goal Drivers utility functions.
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
import {
	CONVERSION_REPORTING_ECOMMERCE_EVENTS,
	CONVERSION_REPORTING_LEAD_EVENTS,
	ENUM_CONVERSION_EVENTS,
} from '@/js/modules/analytics-4/datastore/constants';

export function normalizePrimaryEvents(
	primaryEvent?: string | string[]
): string[] {
	if ( Array.isArray( primaryEvent ) ) {
		return Array.from( new Set( primaryEvent.filter( Boolean ) ) );
	}

	if ( primaryEvent ) {
		return [ primaryEvent ];
	}

	return [];
}

export function getDimensionFiltersForEvents( eventNames: string[] ) {
	if ( ! eventNames?.length ) {
		return undefined;
	}

	return {
		eventName: {
			filterType: 'inListFilter',
			value: eventNames,
		},
	};
}

export function getPrimaryEcommerceEvent(
	detectedEvents: string[] = []
): string | undefined {
	const ecommerceDetectedEvents = detectedEvents.filter( ( event ) =>
		CONVERSION_REPORTING_ECOMMERCE_EVENTS.includes( event )
	);

	if ( ecommerceDetectedEvents.includes( ENUM_CONVERSION_EVENTS.PURCHASE ) ) {
		return ENUM_CONVERSION_EVENTS.PURCHASE;
	}

	return ecommerceDetectedEvents[ 0 ];
}

export function getDetectedLeadEvents(
	detectedEvents: string[] = []
): string[] {
	const leadEvents = detectedEvents.filter( ( event ) =>
		CONVERSION_REPORTING_LEAD_EVENTS.includes( event )
	);

	// If both events are available, we only need submit_lead_form.
	if (
		leadEvents.includes( ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM ) &&
		leadEvents.includes( ENUM_CONVERSION_EVENTS.CONTACT )
	) {
		return leadEvents.filter(
			( event ) => event !== ENUM_CONVERSION_EVENTS.CONTACT
		);
	}

	return leadEvents;
}
