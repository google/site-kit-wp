/**
 * PopularProductsWidget component.
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
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../datastore/constants';
import { MetricTileTable } from '../../../../components/KeyMetrics';
import Link from '../../../../components/Link';
import { numFmt } from '../../../../util';
const { useSelect, useInViewSelect } = Data;

export default function PopularProductsWidget( props ) {
	const { Widget, WidgetNull } = props;

	const productBasePaths = useSelect( ( select ) =>
		select( CORE_SITE ).getProductBasePaths()
	);

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const reportOptions = {
		...dates,
		dimensions: [ 'pageTitle', 'pagePath' ],
		dimensionFilters: {
			pagePath: {
				filterType: 'stringFilter',
				matchType: 'BEGINS_WITH',
				value: productBasePaths,
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

	const showWidget = productBasePaths?.length > 0;

	const report = useInViewSelect( ( select ) =>
		showWidget
			? select( MODULES_ANALYTICS_4 ).getReport( reportOptions )
			: undefined
	);

	const loading = useInViewSelect( ( select ) =>
		showWidget
			? ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
					'getReport',
					[ reportOptions ]
			  )
			: undefined
	);

	const { rows = [] } = report || {};

	const columns = useSelect( ( select ) => [
		{
			field: 'dimensionValues',
			Component: ( { fieldValue } ) => {
				const [ title, url ] = fieldValue;
				const serviceURL = select(
					MODULES_ANALYTICS_4
				).getServiceReportURL( 'all-pages-and-screens', {
					filters: { unifiedPagePathScreen: url.value },
					dates,
				} );

				return (
					<Link
						href={ serviceURL }
						title={ title.value }
						external
						hideExternalIndicator
					>
						{ title.value }
					</Link>
				);
			},
		},
		{
			field: 'metricValues.0.value',
			Component: ( { fieldValue } ) => (
				<strong>{ numFmt( fieldValue ) }</strong>
			),
		},
	] );

	if ( ! showWidget ) {
		return <WidgetNull />;
	}

	const infoTooltip = createInterpolateElement(
		__(
			'Site Kit detected these are your product pages. If this is inaccurate, you can <a>replace</a> this with another metric',
			'google-site-kit'
		),
		{
			a: <Link href="#" external hideExternalIndicator />,
		}
	);

	return (
		<MetricTileTable
			Widget={ Widget }
			title={ __(
				'Most popular products by pageviews',
				'google-site-kit'
			) }
			loading={ loading }
			rows={ rows }
			columns={ columns }
			infoTooltip={ infoTooltip }
			ZeroState={ () =>
				__(
					'Analytics doesn’t have data for your site’s products yet',
					'google-site-kit'
				)
			}
		/>
	);
}

PopularProductsWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType.isRequired,
};
