/**
 * Traffic Overview insight range notice.
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
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import { getTrafficInsightRangeText } from '@/js/modules/analytics-4/components/traffic-overview/utils';

export interface TrafficInsightRangeNoticeProps {
	/** Whether the panel shows the generated insights. Without them, the notice has nothing to explain. */
	insightsShown?: boolean;
	/** Whether the selected date range is longer than 364 days, too long for the generated insight. */
	rangeTooLong?: boolean;
	/** Whether the selected date range has the key factors, which the notice waits for. */
	keyFactorsAvailable?: boolean;
	/** Whether the panel's figures have arrived. The notice waits for them, so it doesn't show before the sections around it. */
	loaded?: boolean;
}

const TrafficInsightRangeNotice: FC< TrafficInsightRangeNoticeProps > = ( {
	insightsShown = true,
	rangeTooLong = false,
	keyFactorsAvailable = true,
	loaded = true,
} ) => {
	const text = getTrafficInsightRangeText( {
		rangeTooLong,
		keyFactorsAvailable,
	} );

	if ( ! insightsShown || ! loaded || ! text ) {
		return null;
	}

	return (
		// `INFO_CIRCLE` gives the info icon of the panel's other notices, and
		// the panel's styles give it their gray background.
		<Notice
			type={ NOTICE_TYPES.INFO_CIRCLE }
			className="googlesitekit-traffic-overview__insight-range-notice"
			description={ text }
		/>
	);
};

export default TrafficInsightRangeNotice;
