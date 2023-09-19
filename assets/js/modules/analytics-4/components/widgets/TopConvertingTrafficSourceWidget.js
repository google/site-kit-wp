/**
 * TopConvertingTrafficSourceWidget component.
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
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../datastore/constants';
import { useInViewSelect } from '../../../../hooks/useInViewSelect';
import MetricTileText from '../../../../components/KeyMetrics/MetricTileText';
import { numFmt } from '../../../../util';
import whenActive from '../../../../util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';

const { useSelect } = Data;

function TopConvertingTrafficSourceWidget( { Widget } ) {
	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} )
	);

	const reportOptions = {
		...dates,
		dimensions: [ 'sessionDefaultChannelGroup' ],
		metrics: [
			{
				name: 'sessionConversionRate',
			},
		],
		limit: 1,
		orderBy: 'sessionConversionRate',
	};

	const report = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getReport( reportOptions )
	);

	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			reportOptions,
		] )
	);

	const loading = useSelect(
		( select ) =>
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ reportOptions ]
			)
	);

	const getRowForDateRange = ( dateRange ) => {
		if ( ! report?.rows ) {
			return null;
		}

		// Filter the report to get only rows that match the given date range.
		const rows = report.rows.filter(
			( { dimensionValues: [ , dateValue ] } ) =>
				dateValue.value === dateRange
		);

		// As the report is limited to 1 row per date range, return the first row.
		return rows[ 0 ];
	};

	const currentRow = getRowForDateRange( 'date_range_0' );
	const previousRow = getRowForDateRange( 'date_range_1' );

	const topChannelGroup = currentRow?.dimensionValues?.[ 0 ].value || '-';
	const topConversionRate = parseFloat(
		currentRow?.metricValues?.[ 0 ].value || '0'
	);
	const previousTopConversionRate = parseFloat(
		previousRow?.metricValues?.[ 0 ].value || '0'
	);

	const format = {
		style: 'percent',
		signDisplay: 'never',
		maximumFractionDigits: 1,
	};

	return (
		<MetricTileText
			Widget={ Widget }
			title={ __( 'Top converting traffic source', 'google-site-kit' ) }
			metricValue={ topChannelGroup }
			metricValueFormat={ format }
			subText={ sprintf(
				/* translators: %d: Percentage of visits that led to conversions. */
				__( '%s of visits led to conversions', 'google-site-kit' ),
				numFmt( topConversionRate, format )
			) }
			previousValue={ previousTopConversionRate }
			currentValue={ topConversionRate }
			loading={ loading }
			error={ error }
			moduleSlug="analytics-4"
			infoTooltip={ __(
				'Channel (e.g. social, paid, search) that brought in visitors who generated the most conversions',
				'google-site-kit'
			) }
		/>
	);
}

TopConvertingTrafficSourceWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};

export default whenActive( {
	moduleName: 'analytics-4',
	FallbackComponent: ConnectGA4CTATileWidget,
} )( TopConvertingTrafficSourceWidget );
