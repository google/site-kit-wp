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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PreviewBlock from '@/js/components/PreviewBlock';
import Typography from '@/js/components/Typography';
import {
	SIZE_LARGE,
	SIZE_MEDIUM,
	TYPE_BODY,
} from '@/js/components/Typography/constants';
import { TileZeroDataMessage } from '@/js/modules/analytics-4/components/common/tiles';
import { TRAFFIC_BREAKDOWN_MAX_ROWS } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { TrafficBreakdownRow as BreakdownRow } from '@/js/modules/analytics-4/components/traffic-overview/utils/getBreakdownRows';
import TrafficBreakdownRow from './TrafficBreakdownRow';

export interface TrafficBreakdownColumnProps {
	/** The column's dimension, such as `devices`, which its modifier class carries. */
	id: string;
	/** The column's heading, which also names it for a screen reader. */
	heading: string;
	/** The rows to render, empty when no value has visits. */
	rows: BreakdownRow[];
	/** Whether the column's values have arrived. */
	loaded?: boolean;
	/** Whether the Analytics property is still gathering data. */
	gatheringData?: boolean;
}

const TrafficBreakdownColumn: FC< TrafficBreakdownColumnProps > = ( {
	id,
	heading,
	rows,
	loaded = true,
	gatheringData = false,
} ) => {
	// `useInstanceId` is typed as `string | number`, so it is read as a string
	// the way `TextField` does.
	const instanceID = useInstanceId(
		TrafficBreakdownColumn,
		'googlesitekit-traffic-overview__breakdown-column-heading'
	);
	const headingID = `${ instanceID }`;

	// A property still gathering data has no figures to show, whatever rows
	// the column gets.
	const showRows = loaded && ! gatheringData;

	return (
		<section
			className={ `googlesitekit-traffic-overview__breakdown-column googlesitekit-traffic-overview__breakdown-column--${ id }` }
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
						// Each placeholder is as tall as a row: its 20px line
						// of text, the 3px gap, and the 4px slot of its bar.
						<PreviewBlock
							key={ index }
							width="100%"
							height="27px"
						/>
					) ) }
				</div>
			) }
			{ loaded && gatheringData && (
				<Typography
					as="p"
					type={ TYPE_BODY }
					size={ SIZE_LARGE }
					className="googlesitekit-traffic-overview__breakdown-column-gathering-data"
				>
					{ __( 'We’re still collecting data', 'google-site-kit' ) }
				</Typography>
			) }
			{ showRows && rows.length === 0 && (
				<TileZeroDataMessage metricLabel="visitors" />
			) }
			{ showRows &&
				rows.length > 0 &&
				// Keyed by position: nothing here reorders, and a dimension
				// value of "Others" would otherwise collide with the folded row.
				rows.map(
					( { label, percentage, formattedPercentage }, index ) => (
						<TrafficBreakdownRow
							key={ index }
							label={ label }
							percentage={ percentage }
							formattedPercentage={ formattedPercentage }
						/>
					)
				) }
		</section>
	);
};

export default TrafficBreakdownColumn;
