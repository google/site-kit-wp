/**
 * TopCategoriesWidget component.
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
import { useSelect, useInViewSelect } from 'googlesitekit-data';
import {
	CORE_USER,
	KM_ANALYTICS_TOP_CATEGORIES,
} from '../../../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../datastore/constants';
import { listFormat, numFmt } from '../../../../util';
import { ZeroDataMessage } from '../common';
import {
	MetricTileTable,
	MetricTileTablePlainText,
} from '../../../../components/KeyMetrics';
import whenActive from '../../../../util/when-active';
import withCustomDimensions from '../../utils/withCustomDimensions';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';
import { splitCategories } from '../../utils';

/**
 * Gets the report options for the Top Categories widget.
 *
 * @since 1.113.0
 *
 * @param {Function} select Data store 'select' function.
 * @return {Object} The report options.
 */
function getReportOptions( select ) {
	const dates = select( CORE_USER ).getDateRangeDates( {
		offsetDays: DATE_RANGE_OFFSET,
	} );

	return {
		...dates,
		dimensions: [ 'customEvent:googlesitekit_post_categories' ],
		dimensionFilters: {
			// Make sure that we select only rows without (not set) records.
			'customEvent:googlesitekit_post_categories': {
				filterType: 'emptyFilter',
				notExpression: true,
			},
		},
		metrics: [ { name: 'screenPageViews' } ],
		orderby: [
			{
				metric: {
					metricName: 'screenPageViews',
				},
				desc: true,
			},
		],
		limit: 3,
		keepEmptyRows: false,
	};
}

function TopCategoriesWidget( { Widget } ) {
	const topCategoriesReportOptions = useSelect( getReportOptions );

	const topCategoriesReport = useInViewSelect(
		( select ) =>
			select( MODULES_ANALYTICS_4 ).getReport(
				topCategoriesReportOptions
			),
		[ topCategoriesReportOptions ]
	);

	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			topCategoriesReportOptions,
		] )
	);

	const loading = useSelect(
		( select ) =>
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ topCategoriesReportOptions ]
			)
	);

	const { rows = [] } = topCategoriesReport || {};

	const columns = [
		{
			field: 'dimensionValues',
			Component( { fieldValue } ) {
				const [ categories ] = fieldValue;

				const categoriesList =
					typeof categories?.value === 'string'
						? splitCategories( categories.value )
						: [];

				const categoriesString = listFormat(
					// All values _must_ be a string or format will throw an error.
					categoriesList.map( String ),
					{ style: 'narrow' }
				);

				return (
					<MetricTileTablePlainText content={ categoriesString } />
				);
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
			widgetSlug={ KM_ANALYTICS_TOP_CATEGORIES }
			loading={ loading }
			rows={ rows }
			columns={ columns }
			ZeroState={ ZeroDataMessage }
			error={ error }
			moduleSlug="analytics-4"
		/>
	);
}

TopCategoriesWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};

export default compose(
	whenActive( {
		moduleName: 'analytics-4',
		FallbackComponent: ConnectGA4CTATileWidget,
	} ),
	withCustomDimensions( {
		reportOptions: getReportOptions,
	} )
)( TopCategoriesWidget );
