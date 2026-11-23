/**
 * Traffic Overview typical traffic range notice.
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
import { getTypicalTrafficRangeWaitingText } from '@/js/modules/analytics-4/components/traffic-overview/utils';

export interface TypicalTrafficRangeNoticeProps {
	/** Whether every day of the selected date range has its typical traffic range, so the chart draws the band and the notice has nothing to say. */
	bandAvailable?: boolean;
	/** The last day of the first date range of this length with the typical traffic range, as `YYYY-MM-DD`, or null when the site has no recorded traffic up to the end of the selected range. */
	availableFrom?: string | null;
	/** Whether the panel's figures have arrived. The notice waits for them, so it doesn't show before the sections around it. */
	loaded?: boolean;
}

const TypicalTrafficRangeNotice: FC< TypicalTrafficRangeNoticeProps > = ( {
	bandAvailable = true,
	availableFrom = null,
	loaded = true,
} ) => {
	const referenceDate = useSelect(
		( select: Select ) => select( CORE_USER ).getReferenceDate(),
		[]
	);

	if ( ! loaded || bandAvailable ) {
		return null;
	}

	return (
		// `INFO_CIRCLE` gives the info icon of the key factors' notices, and
		// the panel's styles give it their gray background.
		<Notice
			type={ NOTICE_TYPES.INFO_CIRCLE }
			className="googlesitekit-traffic-overview__band-notice"
			description={ getTypicalTrafficRangeWaitingText(
				availableFrom,
				referenceDate
			) }
		/>
	);
};

export default TypicalTrafficRangeNotice;
