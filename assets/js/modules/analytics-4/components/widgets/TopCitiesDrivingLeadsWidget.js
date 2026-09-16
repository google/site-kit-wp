/**
 * TopCitiesDrivingLeadsWidget component.
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
 * Internal dependencies
 */
import { useInViewSelect, useSelect } from 'googlesitekit-data';
import {
	MetricTileTable,
	MetricTileTablePlainText,
} from '@/js/components/KeyMetrics';
import {
	CORE_USER,
	KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS,
} from '@/js/googlesitekit/datastore/user/constants';
import { ZeroDataMessage } from '@/js/modules/analytics-4/components/common';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { numFmt } from '@/js/util';
import whenActive from '@/js/util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';

/**
 * Builds the Analytics 4 report options for the Top Cities Driving Leads metric.
 *
 * Both this widget and the metric's PDF tile import this, so the dashboard tile
 * and the report request the same data.
 *
 * @since 1.186.0
 *
 * @param {Object}   dates      The date range for the report.
 * @param {string[]} eventNames The lead event names to filter by.
 * @return {Object} The `getReport` options for the top cities report.
 */
/**
 * Resolves the lead conversion event names to filter the report by, from the
 * property's detected events.
 *
 * Mirrors the dashboard widget: it keeps the detected lead events, and drops
 * `CONTACT` when `SUBMIT_LEAD_FORM` is also present to avoid double-counting.
 * Both this widget and the metric's PDF tile import this, so the dashboard tile
 * and the report request filter by the same events.
 *
 * @since 1.186.0
 *
 * @param {string[]} [detectedEvents] The property's detected conversion events.
 * @return {string[]} The lead event names to filter by.
 */
export function getTopCitiesDrivingLeadsEventNames( detectedEvents ) {
	const eventNames = [
		ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM,
		ENUM_CONVERSION_EVENTS.CONTACT,
		ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
	].filter( ( item ) => detectedEvents?.includes( item ) );

	if (
		eventNames.includes( ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM ) &&
		eventNames.includes( ENUM_CONVERSION_EVENTS.CONTACT )
	) {
		eventNames.splice(
			eventNames.indexOf( ENUM_CONVERSION_EVENTS.CONTACT ),
			1
		);
	}

	return eventNames;
}

export function getTopCitiesDrivingLeadsReportOptions( dates, eventNames ) {
	return {
		...dates,
		dimensions: [ 'city', 'eventName' ],
		dimensionFilters: {
			eventName: {
				filterType: 'inListFilter',
				value: eventNames,
			},
			city: {
				filterType: 'emptyFilter',
				notExpression: true,
			},
		},
		metrics: [ { name: 'eventCount' } ],
		orderby: [
			{
				metric: {
					metricName: 'eventCount',
				},
				desc: true,
			},
		],
		limit: 3,
		keepEmptyRows: false,
		reportID:
			'analytics-4_top-cities-driving-leads-widget_widget_topCitiesReportOptions',
	};
}

function TopCitiesDrivingLeadsWidget( { Widget } ) {
	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates()
	);

	const detectedEvents = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getDetectedEvents()
	);
	const eventNames = getTopCitiesDrivingLeadsEventNames( detectedEvents );

	const topCitiesReportOptions = getTopCitiesDrivingLeadsReportOptions(
		dates,
		eventNames
	);

	const topCitiesReport = useInViewSelect(
		( select ) =>
			eventNames?.length
				? select( MODULES_ANALYTICS_4 ).getReport(
						topCitiesReportOptions
				  )
				: undefined,
		[ eventNames, topCitiesReportOptions ]
	);

	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			topCitiesReportOptions,
		] )
	);

	const loading = useSelect( ( select ) =>
		eventNames?.length
			? ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
					'getReport',
					[ topCitiesReportOptions ]
			  )
			: undefined
	);

	const { rows = [] } = topCitiesReport || {};

	const columns = [
		{
			field: 'dimensionValues',
			Component( { fieldValue } ) {
				const [ title ] = fieldValue;

				return <MetricTileTablePlainText content={ title.value } />;
			},
		},
		{
			field: 'metricValues.0.value',
			Component( { fieldValue } ) {
				return <strong>{ numFmt( fieldValue ) }</strong>;
			},
		},
	];

	return (
		<MetricTileTable
			Widget={ Widget }
			widgetSlug={ KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS }
			loading={ loading }
			rows={ rows }
			columns={ columns }
			ZeroState={ ZeroDataMessage }
			error={ error }
			moduleSlug="analytics-4"
		/>
	);
}

TopCitiesDrivingLeadsWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};

export default whenActive( {
	moduleName: MODULE_SLUG_ANALYTICS_4,
	FallbackComponent: ConnectGA4CTATileWidget,
} )( TopCitiesDrivingLeadsWidget );
