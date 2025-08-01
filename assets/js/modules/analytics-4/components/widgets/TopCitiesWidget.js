/**
 * TopCitiesWidget component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { useSelect, useInViewSelect } from 'googlesitekit-data';
import {
	CORE_USER,
	KM_ANALYTICS_TOP_CITIES,
} from '../../../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '../../constants';
import { ZeroDataMessage } from '../common';
import { numFmt } from '../../../../util';
import {
	MetricTileTable,
	MetricTileTablePlainText,
} from '../../../../components/KeyMetrics';
import whenActive from '../../../../util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';
import { reportRowsWithSetValues } from '../../utils/report-rows-with-set-values';

function TopCitiesWidget( { Widget } ) {
	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const topCitiesReportOptions = {
		...dates,
		dimensions: [ 'city' ],
		metrics: [ { name: 'totalUsers' } ],
		orderby: [
			{
				metric: {
					metricName: 'totalUsers',
				},
				desc: true,
			},
		],
		limit: 4,
		reportID: 'analytics-4_top-cities-widget_widget_topCitiesReportOptions',
	};

	const topCitiesReport = useInViewSelect(
		( select ) =>
			select( MODULES_ANALYTICS_4 ).getReport( topCitiesReportOptions ),
		[ topCitiesReportOptions ]
	);

	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			topCitiesReportOptions,
		] )
	);

	const loading = useSelect(
		( select ) =>
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ topCitiesReportOptions ]
			)
	);

	const { rows = [], totals = [] } = topCitiesReport || {};
	const totalUsers = totals[ 0 ]?.metricValues?.[ 0 ]?.value;

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
				return (
					<strong>
						{ numFmt( fieldValue / totalUsers, {
							style: 'percent',
							maximumFractionDigits: 1,
						} ) }
					</strong>
				);
			},
		},
	];

	return (
		<MetricTileTable
			Widget={ Widget }
			widgetSlug={ KM_ANALYTICS_TOP_CITIES }
			loading={ loading }
			rows={ reportRowsWithSetValues( rows ) }
			columns={ columns }
			ZeroState={ ZeroDataMessage }
			error={ error }
			moduleSlug="analytics-4"
		/>
	);
}

TopCitiesWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};

export default whenActive( {
	moduleName: MODULE_SLUG_ANALYTICS_4,
	FallbackComponent: ConnectGA4CTATileWidget,
} )( TopCitiesWidget );
