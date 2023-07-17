/**
 * NewVisitorsWidget component.
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

const { useSelect, useInViewSelect } = Data;

export default function NewVisitorsWidget( { Widget } ) {
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

	const loading = useInViewSelect(
		( select ) =>
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ reportOptions ]
			)
	);

	const { rows = [] } = report || {};

	const makeFind = ( dateRange ) => ( row ) =>
		get( row, 'dimensionValues.0.value' ) === 'new' &&
		get( row, 'dimensionValues.1.value' ) === dateRange;
	const makeFilter = ( dateRange ) => ( row ) =>
		get( row, 'dimensionValues.1.value' ) === dateRange;
	const reducer = ( acc, row ) =>
		acc + ( parseInt( get( row, 'metricValues.0.value' ), 10 ) || 0 );

	const newVisitors =
		rows.find( makeFind( 'date_range_0' ) )?.metricValues?.[ 0 ]?.value ||
		0;
	const total = rows
		.filter( makeFilter( 'date_range_0' ) )
		.reduce( reducer, 0 );
	const prevTotal = rows
		.filter( makeFilter( 'date_range_1' ) )
		.reduce( reducer, 0 );

	return (
		<MetricTileNumeric
			Widget={ Widget }
			title={ __( 'New visitors', 'google-site-kit' ) }
			metricValue={ newVisitors }
			subText={ sprintf(
				/* translators: %d: Number of total visitors visiting the site. */
				__( 'of %s total visitors', 'google-site-kit' ),
				numFmt( total, { style: 'decimal' } )
			) }
			previousValue={ prevTotal }
			currentValue={ total }
			loading={ loading }
		/>
	);
}

NewVisitorsWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};
