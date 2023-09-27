/**
 * EngagedTrafficSourceWidget component.
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
import { MetricTileText } from '../../../../components/KeyMetrics';
import { numFmt } from '../../../../util';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';
import whenActive from '../../../../util/when-active';
const { useSelect, useInViewSelect } = Data;

function EngagedTrafficSourceWidget( props ) {
	const { Widget } = props;

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} )
	);

	const reportOptions = {
		...dates,
		dimensions: [ 'sessionDefaultChannelGroup' ],
		metrics: [ { name: 'engagedSessions' } ],
		orderBy: 'engagedSessions',
		limit: 1,
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
	const makeFilter = ( dateRange, dimensionIndex ) => ( row ) =>
		get( row, `dimensionValues.${ dimensionIndex }.value` ) === dateRange;

	const topTrafficSource =
		rows.filter( makeFilter( 'date_range_0', 1 ) )[ 0 ]
			?.dimensionValues?.[ 0 ].value || '-';

	const currentEngagedSessions =
		parseFloat(
			rows.filter( makeFilter( 'date_range_0', 1 ) )[ 0 ]
				?.metricValues?.[ 0 ]?.value
		) || 0;
	const currentTotalEngagedSessions =
		parseFloat(
			totals.filter( makeFilter( 'date_range_0', 1 ) )[ 0 ]
				?.metricValues?.[ 0 ]?.value
		) || 0;
	const currentEngagedSessionsRate =
		currentEngagedSessions / currentTotalEngagedSessions || 0;

	const previousEngagedSessions =
		parseFloat(
			rows.filter( makeFilter( 'date_range_1', 1 ) )[ 0 ]
				?.metricValues?.[ 0 ]?.value
		) || 0;
	const previousTotalEngagedSessions =
		parseFloat(
			totals.filter( makeFilter( 'date_range_1', 1 ) )[ 0 ]
				?.metricValues?.[ 0 ]?.value
		) || 0;
	const previousEngagedSessionsRate =
		previousEngagedSessions / previousTotalEngagedSessions || 0;

	const format = {
		style: 'percent',
		signDisplay: 'never',
		maximumFractionDigits: 1,
	};

	return (
		<MetricTileText
			Widget={ Widget }
			title={ __( 'Most engaged traffic source', 'google-site-kit' ) }
			metricValue={ topTrafficSource }
			metricValueFormat={ format }
			subText={ sprintf(
				/* translators: 1. Percentage of total engaged sessions. 2: Total number of engaged sessions. */
				__( '%1$s of %2$s engaged sessions', 'google-site-kit' ),
				numFmt( currentEngagedSessionsRate, format ),
				numFmt( currentTotalEngagedSessions, { style: 'decimal' } )
			) }
			previousValue={ previousEngagedSessionsRate }
			currentValue={ currentEngagedSessionsRate }
			loading={ loading }
			error={ error }
			moduleSlug="analytics-4"
			infoTooltip={ __(
				'Channel (e.g. social, paid, search) that brought in the most visitors who had a meaningful engagement with your site',
				'google-site-kit'
			) }
		/>
	);
}

EngagedTrafficSourceWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};

export default whenActive( {
	moduleName: 'analytics-4',
	FallbackComponent: ConnectGA4CTATileWidget,
} )( EngagedTrafficSourceWidget );
