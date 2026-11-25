/**
 * Traffic Overview typical traffic availability notice.
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
import { FC } from 'react';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	TypicalTrafficAvailability,
	getTypicalTrafficAvailabilityText,
} from '@/js/modules/analytics-4/components/traffic-overview/utils';

export interface TypicalTrafficAvailabilityNoticeProps {
	/** Which parts of the typical traffic view the selected date range has, as `getTypicalTrafficAvailability()` reads them. */
	availability: TypicalTrafficAvailability;
	/** Whether the panel shows the generated insights, with the `trafficInsights` feature. Without them, a range too long for the insight has nothing to explain. */
	insightsEnabled?: boolean;
	/** Whether the panel's figures have arrived. The notice waits for them, so it doesn't show before the sections around it. */
	loaded?: boolean;
}

const TypicalTrafficAvailabilityNotice: FC<
	TypicalTrafficAvailabilityNoticeProps
> = ( { availability, insightsEnabled = false, loaded = true } ) => {
	// A waiting part's notice says when to check back only for a range that
	// ends on the last day a range can end on, today. An earlier range never
	// gains the history it lacks, so the notice asks for one that ends later.
	const endDate = useSelect(
		( select: Select ) => select( CORE_USER ).getDateRangeDates().endDate,
		[]
	);
	const latestSelectableDate = useSelect(
		( select: Select ) => select( CORE_USER ).getLatestSelectableDate(),
		[]
	);

	if ( ! loaded ) {
		return null;
	}

	// One notice says whatever the range lacks, so notices about its parts
	// never stack.
	const text = getTypicalTrafficAvailabilityText( availability, {
		endDate,
		latestSelectableDate,
		insightsEnabled,
	} );

	if ( ! text ) {
		return null;
	}

	return (
		// `INFO_CIRCLE` gives the info icon of the key factors' notice, and
		// the panel's styles give it its gray background.
		<Notice
			type={ NOTICE_TYPES.INFO_CIRCLE }
			className="googlesitekit-traffic-overview__availability-notice"
			description={ text }
		/>
	);
};

export default TypicalTrafficAvailabilityNotice;
