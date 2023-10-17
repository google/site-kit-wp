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
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../datastore/constants';
import { listFormat, numFmt } from '../../../../util';
import { ZeroDataMessage } from '../../../analytics/components/common';
import {
	MetricTileTable,
	MetricTileTablePlainText,
} from '../../../../components/KeyMetrics';
import whenActive from '../../../../util/when-active';
import withCustomDimensions from '../../utils/withCustomDimensions';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';
const { useSelect, useInViewSelect } = Data;

function TopCategoriesWidget( { Widget } ) {
	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const topCategoriesReportOptions = {
		...dates,
		dimensions: [ 'customEvent:googlesitekit_post_categories' ],
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
	};

	const topCategoriesReport = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getReport( topCategoriesReportOptions )
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
			Component: ( { fieldValue } ) => {
				const [ categories ] = fieldValue;
				const categoriesString = listFormat(
					JSON.parse( categories.value )
				);

				return (
					<MetricTileTablePlainText content={ categoriesString } />
				);
			},
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
			title={ __( 'Top categories by pageviews', 'google-site-kit' ) }
			loading={ loading }
			rows={ rows }
			columns={ columns }
			ZeroState={ ZeroDataMessage }
			error={ error }
			moduleSlug="analytics-4"
			infoTooltip={ __(
				'Categories that your site visitors viewed the most',
				'google-site-kit'
			) }
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
	withCustomDimensions()
)( TopCategoriesWidget );
