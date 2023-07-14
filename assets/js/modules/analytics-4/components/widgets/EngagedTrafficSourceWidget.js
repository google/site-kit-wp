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
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../datastore/constants';
import { MetricTileText } from '../../../../components/KeyMetrics';
import { numFmt } from '../../../../util';
const { useSelect, useInViewSelect } = Data;

export default function EngagedTrafficSourceWidget( props ) {
	const { Widget, WidgetNull } = props;

	const isGA4ModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} )
	);

	const reportOptions = {
		...dates,
		dimensions: [ 'sessionDefaultChannelGroup' ],
		metrics: [ { name: 'engagementRate' } ],
		orderBy: 'engagementRate',
		limit: 1,
	};

	const report = useInViewSelect( ( select ) =>
		isGA4ModuleConnected
			? select( MODULES_ANALYTICS_4 ).getReport( reportOptions )
			: undefined
	);

	const loading = useSelect( ( select ) =>
		isGA4ModuleConnected
			? ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
					'getReport',
					[ reportOptions ]
			  )
			: () => undefined
	);

	if ( ! isGA4ModuleConnected ) {
		return <WidgetNull />;
	}

	const { rows = [] } = report || {};
	const makeFilter = ( dateRange, dimensionIndex ) => ( row ) =>
		get( row, `dimensionValues.${ dimensionIndex }.value` ) === dateRange;

	const topTrafficSource =
		rows.filter( makeFilter( 'date_range_0', 1 ) )[ 0 ]
			?.dimensionValues?.[ 0 ].value || '-';

	const currentEngagementRate =
		parseFloat(
			rows.filter( makeFilter( 'date_range_0', 1 ) )[ 0 ]
				?.metricValues?.[ 0 ]?.value
		) || 0;

	const previousEngagementRate =
		parseFloat(
			rows.filter( makeFilter( 'date_range_1', 1 ) )[ 0 ]
				?.metricValues?.[ 0 ]?.value
		) || 0;

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
				/* translators: %s: Number of engaged sessions. */
				__( '%s of engaged sessions', 'google-site-kit' ),
				numFmt( currentEngagementRate, format )
			) }
			previousValue={ previousEngagementRate }
			currentValue={ currentEngagementRate }
			loading={ loading }
		/>
	);
}

EngagedTrafficSourceWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType.isRequired,
};
