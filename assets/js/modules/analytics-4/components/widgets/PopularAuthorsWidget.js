/**
 * PopularAuthorsWidget component.
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
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	CORE_USER,
	KM_ANALYTICS_POPULAR_AUTHORS,
} from '../../../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../datastore/constants';
import {
	MetricTileTable,
	MetricTileTablePlainText,
} from '../../../../components/KeyMetrics';
import { ZeroDataMessage } from '../../../analytics/components/common';
import withCustomDimensions from '../../utils/withCustomDimensions';
import whenActive from '../../../../util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';
import { numFmt } from '../../../../util';
const { useSelect, useInViewSelect } = Data;

function getPopularAuthorsWidgetReportOptions( select ) {
	const dates = select( CORE_USER ).getDateRangeDates( {
		offsetDays: DATE_RANGE_OFFSET,
	} );

	return {
		...dates,
		dimensions: [ 'customEvent:googlesitekit_post_author' ],
		dimensionFilters: {
			// Make sure that we select only rows without (not set) records.
			'customEvent:googlesitekit_post_author': {
				filterType: 'stringFilter',
				matchType: 'EXACT',
				value: '(not set)',
				notExpression: true,
			},
		},
		metrics: [ { name: 'screenPageViews' } ],
		orderby: [
			{
				metric: { metricName: 'screenPageViews' },
				desc: true,
			},
		],
		limit: 3,
	};
}

function PopularAuthorsWidget( props ) {
	const { Widget } = props;

	const reportOptions = useSelect( getPopularAuthorsWidgetReportOptions );
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

	const columns = [
		{
			field: 'dimensionValues.0.value',
			Component: ( { fieldValue } ) => (
				<MetricTileTablePlainText content={ fieldValue } />
			),
		},
		{
			field: 'metricValues.0.value',
			Component: ( { fieldValue } ) => (
				<strong>{ numFmt( fieldValue ) }</strong>
			),
		},
	];

	return (
		<MetricTileTable
			Widget={ Widget }
			widgetSlug={ KM_ANALYTICS_POPULAR_AUTHORS }
			loading={ loading }
			rows={ rows }
			columns={ columns }
			ZeroState={ ZeroDataMessage }
			error={ error }
			moduleSlug="analytics-4"
		/>
	);
}

PopularAuthorsWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};

export default compose(
	whenActive( {
		moduleName: 'analytics-4',
		FallbackComponent: ConnectGA4CTATileWidget,
	} ),
	withCustomDimensions( {
		reportOptions: getPopularAuthorsWidgetReportOptions,
	} )
)( PopularAuthorsWidget );
