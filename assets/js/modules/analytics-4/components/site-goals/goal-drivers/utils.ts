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

export function normalizePrimaryEvents(
	primaryEvent?: string | string[]
): string[] {
	const primaryEvents = Array.isArray( primaryEvent )
		? primaryEvent
		: [ primaryEvent ];

	return Array.from(
		new Set(
			primaryEvents.filter( ( event ): event is string =>
				Boolean( event )
			)
		)
	);
}

export function getDimensionFiltersForEvents(
	eventNames: string[],
	breakdownFilter?: Record< string, unknown >
) {
	if ( ! eventNames.length ) {
		return undefined;
	}

	return {
		eventName: {
			filterType: 'inListFilter',
			value: eventNames,
		},
		...breakdownFilter,
	};
}
