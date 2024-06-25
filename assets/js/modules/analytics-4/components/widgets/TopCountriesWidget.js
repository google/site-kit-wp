/**
 * TopCountriesWidget component.
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
import Data from 'googlesitekit-data';
import {
	CORE_USER,
	KM_ANALYTICS_TOP_COUNTRIES,
} from '../../../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../datastore/constants';
import { ZeroDataMessage } from '../common';
import { numFmt } from '../../../../util';
import {
	MetricTileTable,
	MetricTileTablePlainText,
} from '../../../../components/KeyMetrics';
const { useSelect, useInViewSelect } = Data;
import whenActive from '../../../../util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';

function TopCountriesWidget( { Widget } ) {
	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const topCountriesReportOptions = {
		...dates,
		dimensions: [ 'country' ],
		metrics: [ { name: 'totalUsers' } ],
		orderby: [
			{
				metric: {
					metricName: 'totalUsers',
				},
				desc: true,
			},
		],
		limit: 3,
	};

	const topCountriesReport = useInViewSelect(
		( select ) =>
			select( MODULES_ANALYTICS_4 ).getReport(
				topCountriesReportOptions
			),
		[ topCountriesReportOptions ]
	);

	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			topCountriesReportOptions,
		] )
	);

	const loading = useSelect(
		( select ) =>
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ topCountriesReportOptions ]
			)
	);

	const { rows = [], totals = [] } = topCountriesReport || {};

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
			widgetSlug={ KM_ANALYTICS_TOP_COUNTRIES }
			loading={ loading }
			rows={ rows }
			columns={ columns }
			ZeroState={ ZeroDataMessage }
			error={ error }
			moduleSlug="analytics-4"
		/>
	);
}

TopCountriesWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};

export default whenActive( {
	moduleName: 'analytics-4',
	FallbackComponent: ConnectGA4CTATileWidget,
} )( TopCountriesWidget );
