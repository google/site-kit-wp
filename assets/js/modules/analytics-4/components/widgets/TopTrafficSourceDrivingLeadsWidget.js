/**
 * TopTrafficSourceDrivingLeadsWidget component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useInViewSelect } from 'googlesitekit-data';
import MetricTileText from '../../../../components/KeyMetrics/MetricTileText';
import {
	CORE_USER,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS,
} from '../../../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../datastore/constants';
import { numFmt } from '../../../../util';
import { get } from 'lodash';
import whenActive from '../../../../util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';

function getDateRangeIndex( reportRows, dateRangeSlug ) {
	const dateRange = reportRows?.[ 0 ]?.dimensionValues?.find(
		( dimension ) => dimension.value === dateRangeSlug
	);
	const dateRangeIndex =
		reportRows?.[ 0 ]?.dimensionValues?.indexOf( dateRange );

	return dateRangeIndex;
}

function TopTrafficSourceDrivingLeadsWidget( { Widget } ) {
	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} )
	);

	const detectedEvents = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getDetectedEvents()
	);
	const eventNames = [
		'submit_lead_form',
		'contact',
		'generate_lead',
	].filter( ( item ) => detectedEvents?.includes( item ) );

	if (
		eventNames.includes( 'submit_lead_form' ) &&
		eventNames.includes( 'contact' )
	) {
		eventNames.splice( eventNames.indexOf( 'contact' ), 1 );
	}

	const totalLeadsReportOptions = {
		...dates,
		metrics: [
			{
				name: 'eventCount',
			},
		],
		dimensions: [ 'eventName' ],
		dimensionFilters: {
			eventName: {
				filterType: 'inListFilter',
				value: eventNames,
			},
		},
	};

	const trafficSourceReportOptions = {
		...dates,
		dimensions: [ 'sessionDefaultChannelGroup', 'eventName' ],
		dimensionFilters: {
			eventName: {
				filterType: 'inListFilter',
				value: eventNames,
			},
		},
		metrics: [
			{
				name: 'eventCount',
			},
		],
		limit: 1,
		orderBy: 'eventCount',
	};

	const totalLeadsReport = useInViewSelect(
		( select ) =>
			eventNames.length
				? select( MODULES_ANALYTICS_4 ).getReport(
						totalLeadsReportOptions
				  )
				: undefined,
		[ eventNames, totalLeadsReportOptions ]
	);

	const trafficSourceReport = useInViewSelect(
		( select ) =>
			eventNames.length
				? select( MODULES_ANALYTICS_4 ).getReport(
						trafficSourceReportOptions
				  )
				: undefined,
		[ eventNames, trafficSourceReportOptions ]
	);

	const error = useSelect( ( select ) => {
		const trafficSourceReportErrors = select(
			MODULES_ANALYTICS_4
		).getErrorForSelector( 'getReport', [ trafficSourceReportOptions ] );

		const totalLeadsReportErrors = select(
			MODULES_ANALYTICS_4
		).getErrorForSelector( 'getReport', [ totalLeadsReportOptions ] );

		if ( trafficSourceReportErrors && totalLeadsReportErrors ) {
			return [ trafficSourceReportErrors, totalLeadsReportErrors ];
		}

		return trafficSourceReportErrors || totalLeadsReportErrors || undefined;
	} );

	const loading = useSelect( ( select ) =>
		eventNames.length
			? ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
					'getReport',
					[ totalLeadsReportOptions ]
			  ) ||
			  ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
					'getReport',
					[ trafficSourceReportOptions ]
			  )
			: undefined
	);

	const makeFilter = ( dateRange, dimensionIndex ) => ( row ) =>
		get( row, `dimensionValues.${ dimensionIndex }.value` ) === dateRange;

	// Prevents running a filter on `report.rows` which could be undefined.
	const { rows: totalLeadsReportRows = [] } = totalLeadsReport || {};
	const { rows: trafficSourceReportRows = [] } = trafficSourceReport || {};

	const topTrafficSourceDateRangeIndex = getDateRangeIndex(
		trafficSourceReportRows,
		'date_range_0'
	);

	const topTrafficSource =
		trafficSourceReportRows.filter(
			makeFilter( 'date_range_0', topTrafficSourceDateRangeIndex )
		)[ 0 ]?.dimensionValues?.[ 0 ].value || '-';

	const currentTotalLeadsDateRangeIndex = getDateRangeIndex(
		totalLeadsReportRows,
		'date_range_0'
	);

	const currentTotalLeads =
		parseInt(
			totalLeadsReportRows.filter(
				makeFilter( 'date_range_0', currentTotalLeadsDateRangeIndex )
			)[ 0 ]?.metricValues?.[ 0 ]?.value,
			10
		) || 0;
	const currentTopTrafficSourceLeadsDateRangeIndex = getDateRangeIndex(
		trafficSourceReportRows,
		'date_range_0'
	);
	const currentTopTrafficSourceLeads =
		parseInt(
			trafficSourceReportRows.filter(
				makeFilter(
					'date_range_0',
					currentTopTrafficSourceLeadsDateRangeIndex
				)
			)[ 0 ]?.metricValues?.[ 0 ]?.value,
			10
		) || 0;
	const relativeCurrentTopTrafficSourceUsers = currentTotalLeads
		? currentTopTrafficSourceLeads / currentTotalLeads
		: 0;

	const previousTotalLeadsDateRangeIndex = getDateRangeIndex(
		totalLeadsReportRows,
		'date_range_1'
	);
	const previousTotalLeads =
		parseInt(
			totalLeadsReportRows.filter(
				makeFilter( 'date_range_1', previousTotalLeadsDateRangeIndex )
			)[ 0 ]?.metricValues?.[ 0 ]?.value,
			10
		) || 0;

	const previousTopTrafficSourceUsersDateRangeIndex = getDateRangeIndex(
		trafficSourceReportRows,
		'date_range_1'
	);
	const previousTopTrafficSourceUsers =
		parseInt(
			trafficSourceReportRows.filter(
				makeFilter(
					'date_range_1',
					previousTopTrafficSourceUsersDateRangeIndex
				)
			)[ 0 ]?.metricValues?.[ 0 ]?.value,
			10
		) || 0;
	const relativePreviousTopTrafficSourceUsers = previousTotalLeads
		? previousTopTrafficSourceUsers / previousTotalLeads
		: 0;

	const format = {
		style: 'percent',
		signDisplay: 'never',
		maximumFractionDigits: 1,
	};

	return (
		<MetricTileText
			Widget={ Widget }
			widgetSlug={ KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS }
			metricValue={ topTrafficSource }
			metricValueFormat={ format }
			subText={
				// eslint-disable-next-line @wordpress/valid-sprintf
				sprintf(
					/* translators: %d: Percentage of leads for the current top traffic source compared to the number of total leads for all traffic sources. */
					__( '%s of total leads', 'google-site-kit' ),
					numFmt( relativeCurrentTopTrafficSourceUsers, format )
				)
			}
			previousValue={ relativePreviousTopTrafficSourceUsers }
			currentValue={ relativeCurrentTopTrafficSourceUsers }
			loading={ loading }
			error={ error }
			moduleSlug="analytics-4"
		/>
	);
}

TopTrafficSourceDrivingLeadsWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};

export default whenActive( {
	moduleName: 'analytics-4',
	FallbackComponent: ConnectGA4CTATileWidget,
} )( TopTrafficSourceDrivingLeadsWidget );
