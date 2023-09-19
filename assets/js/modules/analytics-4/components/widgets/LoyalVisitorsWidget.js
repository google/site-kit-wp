/**
 * LoyalVisitorsWidget component.
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
import { get } from 'lodash';

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
import { MetricTileNumeric } from '../../../../components/KeyMetrics';
import { numFmt } from '../../../../util';
import whenActive from '../../../../util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';

const { useSelect, useInViewSelect } = Data;

function LoyalVisitorsWidget( { Widget } ) {
	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} )
	);

	const reportOptions = {
		...dates,
		dimensions: [ 'newVsReturning' ],
		metrics: [ { name: 'activeUsers' } ],
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

	const { rows = [], totals = [] } = report || {};

	const makeFind = ( dateRange ) => ( row ) =>
		get( row, 'dimensionValues.0.value' ) === 'returning' &&
		get( row, 'dimensionValues.1.value' ) === dateRange;

	const returning =
		rows.find( makeFind( 'date_range_0' ) )?.metricValues?.[ 0 ]?.value ||
		0;

	const total = totals[ 0 ]?.metricValues?.[ 0 ]?.value || 0;

	const prevReturning =
		rows.find( makeFind( 'date_range_1' ) )?.metricValues?.[ 0 ]?.value ||
		0;

	const prevTotal = totals[ 1 ]?.metricValues?.[ 0 ]?.value || 0;

	const currentPercentage = total > 0 ? returning / total : 0;
	const prevPercentage = prevTotal > 0 ? prevReturning / prevTotal : 0;

	const format = {
		style: 'percent',
		signDisplay: 'never',
		maximumFractionDigits: 1,
	};

	return (
		<MetricTileNumeric
			Widget={ Widget }
			title={ __( 'Returning visitors', 'google-site-kit' ) }
			metricValue={ currentPercentage }
			metricValueFormat={ format }
			subText={ sprintf(
				/* translators: %d: Number of total visitors visiting the site. */
				__( 'of %s total visitors', 'google-site-kit' ),
				numFmt( total, { style: 'decimal' } )
			) }
			previousValue={ prevPercentage }
			currentValue={ currentPercentage }
			loading={ loading }
			error={ error }
			moduleSlug="analytics-4"
		/>
	);
}

LoyalVisitorsWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};

export default whenActive( {
	moduleName: 'analytics-4',
	FallbackComponent: ConnectGA4CTATileWidget,
} )( LoyalVisitorsWidget );
