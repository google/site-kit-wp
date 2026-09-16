/**
 * Traffic Overview breakdown column.
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
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import PreviewBlock from '@/js/components/PreviewBlock';
import Typography from '@/js/components/Typography';
import { SIZE_MEDIUM, TYPE_BODY } from '@/js/components/Typography/constants';
import ZeroDataMessage from '@/js/modules/analytics-4/components/site-goals/components/ZeroDataMessage';
import { TRAFFIC_BREAKDOWN_MAX_ROWS } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { TrafficBreakdownRow as BreakdownRow } from '@/js/modules/analytics-4/components/traffic-overview/utils/getBreakdownRows';
import TrafficBreakdownRow from './TrafficBreakdownRow';

export interface TrafficBreakdownColumnProps {
	/** The column's heading, which also names it for a screen reader. */
	heading: string;
	/** The rows to render, empty when the report returned none. */
	rows: BreakdownRow[];
	/** Whether the column's report has arrived. */
	loaded?: boolean;
}

const TrafficBreakdownColumn: FC< TrafficBreakdownColumnProps > = ( {
	heading,
	rows,
	loaded = true,
} ) => {
	// `useInstanceId` is typed as `string | number`, so it is read as a string
	// the way `TextField` does.
	const instanceID = useInstanceId(
		TrafficBreakdownColumn,
		'googlesitekit-traffic-overview__breakdown-column-heading'
	);
	const headingID = `${ instanceID }`;

	return (
		<section
			className="googlesitekit-traffic-overview__breakdown-column"
			aria-labelledby={ headingID }
		>
			<Typography
				as="h4"
				type={ TYPE_BODY }
				size={ SIZE_MEDIUM }
				id={ headingID }
				className="googlesitekit-traffic-overview__breakdown-column-heading"
			>
				{ heading }
			</Typography>
			{ ! loaded && (
				<div className="googlesitekit-traffic-overview__breakdown-column-loading">
					{ Array.from( {
						length: TRAFFIC_BREAKDOWN_MAX_ROWS,
					} ).map( ( _, index ) => (
						<PreviewBlock
							key={ index }
							width="100%"
							height="20px"
						/>
					) ) }
				</div>
			) }
			{ loaded && rows.length === 0 && (
				<ZeroDataMessage metricLabel="visitors" />
			) }
			{ loaded &&
				rows.length > 0 &&
				// Keyed by position: nothing here reorders, and a dimension
				// value of "Others" would otherwise collide with the folded row.
				rows.map( ( { label, percentage }, index ) => (
					<TrafficBreakdownRow
						key={ index }
						label={ label }
						percentage={ percentage }
					/>
				) ) }
		</section>
	);
};

export default TrafficBreakdownColumn;
