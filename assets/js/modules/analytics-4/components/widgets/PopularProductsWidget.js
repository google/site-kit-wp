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
import {
	createInterpolateElement,
	useCallback,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	CORE_USER,
	KM_ANALYTICS_POPULAR_PRODUCTS,
} from '../../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../datastore/constants';
import { CORE_UI } from '../../../../googlesitekit/datastore/ui/constants';
import { KEY_METRICS_SELECTION_PANEL_OPENED_KEY } from '../../../../components/KeyMetrics/constants';
import {
	MetricTileTable,
	MetricTileTablePlainText,
} from '../../../../components/KeyMetrics';
import Link from '../../../../components/Link';
import { numFmt } from '../../../../util';
import whenActive from '../../../../util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';
import useViewOnly from '../../../../hooks/useViewOnly';
const { useSelect, useInViewSelect, useDispatch } = Data;

function PopularProductsWidget( props ) {
	const { Widget, WidgetNull } = props;

	const viewOnlyDashboard = useViewOnly();

	const productBasePaths = useSelect( ( select ) =>
		select( CORE_SITE ).getProductBasePaths()
	);

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const { setValue } = useDispatch( CORE_UI );
	const [ showTooltip, setShowTooltip ] = useState( true );

	const openMetricsSelectionPanel = useCallback( () => {
		// Hide the tooltip so it doesn't remain visible, above the panel we're
		// opening.
		setShowTooltip( false );

		// Open the panel.
		setValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY, true );

		// Wait for the panel to be open before we re-enable the tooltip.
		// This prevents it from appearing above the slide-out panel, see:
		// https://github.com/google/site-kit-wp/issues/7060#issuecomment-1664827831
		setTimeout( () => {
			setShowTooltip( true );
		}, 0 );
	}, [ setValue ] );

	const reportOptions = {
		...dates,
		dimensions: [ 'pagePath' ],
		dimensionFilters: {
			pagePath: {
				filterType: 'stringFilter',
				matchType: 'PARTIAL_REGEXP',
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

	const isPopularProductsWidgetActive = useSelect( ( select ) =>
		select( CORE_USER ).isKeyMetricActive( KM_ANALYTICS_POPULAR_PRODUCTS )
	);

	const siteHasProductBasePaths = productBasePaths?.length > 0;

	const showWidget = isPopularProductsWidgetActive || siteHasProductBasePaths;

	const report = useInViewSelect( ( select ) =>
		showWidget
			? select( MODULES_ANALYTICS_4 ).getReport( reportOptions )
			: undefined
	);

	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			reportOptions,
		] )
	);

	const titles = useInViewSelect( ( select ) =>
		! error && report
			? select( MODULES_ANALYTICS_4 ).getPageTitles(
					report,
					reportOptions
			  )
			: undefined
	);

	const loading = useSelect( ( select ) =>
		showWidget
			? ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
					'getReport',
					[ reportOptions ]
			  ) || titles === undefined
			: undefined
	);

	const { rows = [] } = report || {};

	const columns = [
		{
			field: 'dimensionValues.0.value',
			Component: ( { fieldValue } ) => {
				const url = fieldValue;
				const title = titles[ url ];
				// Utilizing `useSelect` inside the component rather than
				// returning its direct value to the `columns` array.
				// This pattern ensures that the component re-renders correctly based on changes in state,
				// preventing potential issues with stale or out-of-sync data.
				// Note: This pattern is replicated in a few other spots within our codebase.
				const serviceURL = useSelect( ( select ) => {
					return ! viewOnlyDashboard
						? select( MODULES_ANALYTICS_4 ).getServiceReportURL(
								'all-pages-and-screens',
								{
									filters: {
										unifiedPagePathScreen: url,
									},
									dates,
								}
						  )
						: null;
				} );

				if ( viewOnlyDashboard ) {
					return <MetricTileTablePlainText content={ title } />;
				}

				return (
					<Link
						href={ serviceURL }
						title={ title }
						external
						hideExternalIndicator
					>
						{ title }
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
	];

	if ( ! showWidget ) {
		return <WidgetNull />;
	}

	const infoTooltip = createInterpolateElement(
		__(
			'Products on your site which visitors viewed the most. Site Kit detected these are your product pages. If this is inaccurate, you can <a>replace</a> this with another metric',
			'google-site-kit'
		),
		{
			a: <Link onClick={ openMetricsSelectionPanel } />,
		}
	);

	let zeroStateMessage = __(
		'Analytics doesn’t have data for your site’s products yet',
		'google-site-kit'
	);

	if ( ! siteHasProductBasePaths && isPopularProductsWidgetActive ) {
		zeroStateMessage = __(
			'No product posts currently detected on your site. This metric applies only to sites with product posts.',
			'google-site-kit'
		);
	}

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
			infoTooltip={ showTooltip ? infoTooltip : null }
			ZeroState={ () => zeroStateMessage }
			error={ error }
			moduleSlug="analytics-4"
		/>
	);
}

PopularProductsWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType.isRequired,
};

export default whenActive( {
	moduleName: 'analytics-4',
	FallbackComponent: ConnectGA4CTATileWidget,
} )( PopularProductsWidget );
