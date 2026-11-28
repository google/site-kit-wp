/**
 * `useTypicalTrafficDateRange` hook.
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
import { useSelect } from 'googlesitekit-data';
import {
	TypicalTrafficDateRange,
	selectTypicalTrafficDateRange,
} from '@/js/modules/analytics-4/components/traffic-overview/utils';

/**
 * Gets the selected date range, as the typical traffic view reads it: ending
 * on the day before the reference date, the last full day, as
 * `selectTypicalTrafficDateRange()` explains.
 *
 * @since n.e.x.t
 *
 * @return {Object} The range's first and last days, those of the range just before it, the number of its days, and the last day a range can end on.
 */
export function useTypicalTrafficDateRange(): TypicalTrafficDateRange {
	return useSelect( selectTypicalTrafficDateRange, [] );
}
