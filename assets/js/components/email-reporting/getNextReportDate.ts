/**
 * Utility to compute the next email report date.
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
import { stringToDate } from '@/js/util';

type EmailReportingFrequency = 'weekly' | 'monthly' | 'quarterly';

/**
 * Gets the next report date for a given frequency.
 *
 * @since n.e.x.t
 *
 * @param {EmailReportingFrequency} frequency     Email reporting frequency.
 * @param {string}                  referenceDate Date string as `YYYY-MM-DD`.
 * @param {number}                  weekStartDay  Week start day index (`0` for Sunday through `6` for Saturday).
 * @return {Date} Next report date.
 */
export default function getNextReportDate(
	frequency: EmailReportingFrequency,
	referenceDate: string,
	weekStartDay: number
): Date {
	const nextReportDate = stringToDate( referenceDate );

	switch ( frequency ) {
		case 'weekly': {
			const normalizedWeekStartDay =
				Number.isInteger( weekStartDay ) &&
				weekStartDay >= 0 &&
				weekStartDay <= 6
					? weekStartDay
					: 1;
			const currentWeekday = nextReportDate.getDay();
			let daysUntilTarget =
				( normalizedWeekStartDay - currentWeekday + 7 ) % 7;

			// Use the next occurrence of the week start day.
			if ( 0 === daysUntilTarget ) {
				daysUntilTarget = 7;
			}

			nextReportDate.setDate(
				nextReportDate.getDate() + daysUntilTarget
			);
			break;
		}

		case 'monthly':
			nextReportDate.setMonth( nextReportDate.getMonth() + 1, 1 );
			break;

		case 'quarterly': {
			const currentMonth = nextReportDate.getMonth() + 1;
			// Month offset within quarter: 0 => first, 1 => second, 2 => third.
			const position = ( currentMonth - 1 ) % 3;
			const monthsToAdd = 3 - position;

			nextReportDate.setMonth(
				nextReportDate.getMonth() + monthsToAdd,
				1
			);
			break;
		}

		default:
			break;
	}

	return nextReportDate;
}
