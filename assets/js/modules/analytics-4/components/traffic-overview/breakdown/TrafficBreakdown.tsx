/**
 * Traffic Overview breakdown.
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
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Link from '@/js/components/Link';
import Typography from '@/js/components/Typography';
import { SIZE_MEDIUM, TYPE_TITLE } from '@/js/components/Typography/constants';
import { TRAFFIC_BREAKDOWN_COLUMNS } from '@/js/modules/analytics-4/components/traffic-overview/breakdown/columns';
import { TRAFFIC_BREAKDOWN_EXPANDED_MAX_ROWS } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import {
	TrafficBreakdownValue,
	getBreakdownRows,
} from '@/js/modules/analytics-4/components/traffic-overview/utils/getBreakdownRows';
import TrafficBreakdownColumn from './TrafficBreakdownColumn';

export interface TrafficBreakdownProps {
	/** The values of each column, keyed by the column's `id`, each ordered by visitors, most first. */
	values: Record< string, TrafficBreakdownValue[] | undefined >;
	/** Whether the values have arrived. */
	loaded?: boolean;
	/** Whether the Analytics property is still gathering data. */
	gatheringData?: boolean;
}

const TrafficBreakdown: FC< TrafficBreakdownProps > = ( {
	values,
	loaded = true,
	gatheringData = false,
} ) => {
	const [ isExpanded, setIsExpanded ] = useState( false );

	// `useInstanceId` is typed as `string | number`, so each ID is read as a
	// string the way `TextField` does.
	const headingInstanceID = useInstanceId(
		TrafficBreakdown,
		'googlesitekit-traffic-overview__breakdown-heading'
	);
	const headingID = `${ headingInstanceID }`;
	const columnsInstanceID = useInstanceId(
		TrafficBreakdown,
		'googlesitekit-traffic-overview__breakdown-columns'
	);
	const columnsID = `${ columnsInstanceID }`;

	const toggleExpanded = useCallback( () => {
		setIsExpanded( ( expanded ) => ! expanded );
	}, [] );

	const columns = TRAFFIC_BREAKDOWN_COLUMNS.map( ( { id, heading } ) => ( {
		id,
		heading,
		collapsedRows: getBreakdownRows( values[ id ] ),
		expandedRows: getBreakdownRows(
			values[ id ],
			TRAFFIC_BREAKDOWN_EXPANDED_MAX_ROWS
		),
	} ) );

	// Only a column with values folded into its "Others" row gets more rows
	// once expanded, so the toggle shows only when one of them has.
	const hasMoreRows = columns.some(
		( { collapsedRows, expandedRows } ) =>
			expandedRows.length > collapsedRows.length
	);

	return (
		<section
			className="googlesitekit-traffic-overview__breakdown"
			aria-labelledby={ headingID }
		>
			<Typography
				as="h3"
				type={ TYPE_TITLE }
				size={ SIZE_MEDIUM }
				id={ headingID }
				className="googlesitekit-traffic-overview__breakdown-heading"
			>
				{ __( 'Traffic breakdown', 'google-site-kit' ) }
			</Typography>
			<div
				id={ columnsID }
				className="googlesitekit-traffic-overview__breakdown-columns"
			>
				{ columns.map(
					( { id, heading, collapsedRows, expandedRows } ) => (
						<TrafficBreakdownColumn
							key={ id }
							id={ id }
							heading={ heading }
							loaded={ loaded }
							gatheringData={ gatheringData }
							rows={ isExpanded ? expandedRows : collapsedRows }
						/>
					)
				) }
			</div>
			{ loaded && ! gatheringData && hasMoreRows && (
				<Link
					className="googlesitekit-traffic-overview__breakdown-toggle"
					onClick={ toggleExpanded }
					aria-expanded={ isExpanded }
					aria-controls={ columnsID }
					secondary
				>
					{ isExpanded
						? __( 'Show less', 'google-site-kit' )
						: __( 'Show more', 'google-site-kit' ) }
				</Link>
			) }
		</section>
	);
};

export default TrafficBreakdown;
