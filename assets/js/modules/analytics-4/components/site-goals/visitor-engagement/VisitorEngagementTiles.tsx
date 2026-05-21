/**
 * Site Goals Visitor Engagement tiles.
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
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import EngagementRateTile from '@/js/modules/analytics-4/components/site-goals/visitor-engagement/EngagementRateTile';
import VisitorEngagementEventTile from '@/js/modules/analytics-4/components/site-goals/visitor-engagement/VisitorEngagementEventTile';
import { VisitorEngagementEventID } from '@/js/modules/analytics-4/components/site-goals/visitor-engagement/registry';

interface DateRange {
	startDate: string;
	endDate: string;
	compareStartDate?: string;
	compareEndDate?: string;
}

interface VisitorEngagementTilesProps {
	dates: DateRange;
	events?: VisitorEngagementEventID[];
}

const VisitorEngagementTiles: FC< VisitorEngagementTilesProps > = ( {
	dates,
	events = [],
} ) => {
	return (
		<Fragment>
			<EngagementRateTile dates={ dates } />
			{ events.map( ( eventName ) => (
				<VisitorEngagementEventTile
					key={ eventName }
					dates={ dates }
					eventName={ eventName }
				/>
			) ) }
		</Fragment>
	);
};

export default VisitorEngagementTiles;
