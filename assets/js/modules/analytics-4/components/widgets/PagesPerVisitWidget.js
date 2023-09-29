/**
 * PagesPerVisitWidget component.
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
import { numFmt } from '../../../../util/i18n';
import whenActive from '../../../../util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';

const { useSelect, useInViewSelect } = Data;

function PagesPerVisitWidget( { Widget } ) {
	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} )
	);

	const reportOptions = {
		...dates,
		metrics: [
			{ name: 'screenPageViewsPerSession' },
			{ name: 'sessions' },
		],
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

	const { rows = [] } = report || {};

	const makeFind = ( dateRange ) => ( row ) =>
		get( row, 'dimensionValues.0.value' ) === dateRange;

	const currentPagesPerVisit =
		Number(
			rows.find( makeFind( 'date_range_0' ) )?.metricValues?.[ 0 ]?.value
		) || 0;

	const previousPagesPerVisit =
		Number(
			rows.find( makeFind( 'date_range_1' ) )?.metricValues?.[ 0 ]?.value
		) || 0;

	const currentTotalSessions =
		Number(
			rows.find( makeFind( 'date_range_0' ) )?.metricValues?.[ 1 ]?.value
		) || 0;

	const format = {
		style: 'decimal',
		maximumFractionDigits: 2,
	};

	return (
		<MetricTileNumeric
			Widget={ Widget }
			title={ __( 'Pages per visit', 'google-site-kit' ) }
			metricValue={ currentPagesPerVisit }
			metricValueFormat={ format }
			subText={ sprintf(
				/* translators: %s: Number of total page views. */
				__( '%s total visits', 'google-site-kit' ),
				numFmt( currentTotalSessions, { style: 'decimal' } )
			) }
			previousValue={ previousPagesPerVisit }
			currentValue={ currentPagesPerVisit }
			loading={ loading }
			error={ error }
			moduleSlug="analytics-4"
			infoTooltip={ __(
				'Number of pages visitors viewed per session on average',
				'google-site-kit'
			) }
		/>
	);
}

PagesPerVisitWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};

export default whenActive( {
	moduleName: 'analytics-4',
	FallbackComponent: ConnectGA4CTATileWidget,
} )( PagesPerVisitWidget );
