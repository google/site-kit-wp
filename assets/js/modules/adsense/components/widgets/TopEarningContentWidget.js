/**
 * TopEarningContentWidget component.
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
	KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
} from '../../../../googlesitekit/datastore/user/constants';
import { DATE_RANGE_OFFSET, MODULES_ADSENSE } from '../../datastore/constants';
import {
	MetricTileTable,
	MetricTileTablePlainText,
} from '../../../../components/KeyMetrics';
import Link from '../../../../components/Link';
import { ZeroDataMessage } from '../../../analytics-4/components/common';
import { numFmt } from '../../../../util';
import whenActive from '../../../../util/when-active';
import ConnectGA4CTATileWidget from '../../../analytics-4/components/widgets/ConnectGA4CTATileWidget';
import useViewOnly from '../../../../hooks/useViewOnly';
import { AdSenseLinkCTA } from '../common';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import ConnectAdSenseCTATileWidget from './ConnectAdSenseCTATileWidget';
const { useSelect, useInViewSelect } = Data;

function TopEarningContentWidget( { Widget } ) {
	const viewOnlyDashboard = useViewOnly();

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const adSenseAccountID = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAccountID()
	);

	const reportOptions = {
		...dates,
		dimensions: [ 'pagePath', 'adSourceName' ],
		metrics: [ { name: 'totalAdRevenue' } ],
		filter: {
			fieldName: 'adSourceName',
			stringFilter: {
				matchType: 'EXACT',
				value: `Google AdSense account (${ adSenseAccountID })`,
			},
		},
		orderby: [
			{
				metric: { metricName: 'totalAdRevenue' },
				desc: true,
			},
		],
		limit: 3,
	};

	const report = useInViewSelect( ( select ) => {
		return select( MODULES_ANALYTICS_4 ).getReport( reportOptions );
	} );

	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			reportOptions,
		] )
	);

	const titles = useInViewSelect( ( select ) =>
		! error
			? select( MODULES_ANALYTICS_4 ).getPageTitles(
					report,
					reportOptions
			  )
			: undefined
	);

	const loading = useSelect(
		( select ) =>
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ reportOptions ]
			) || titles === undefined
	);

	const isAdSenseLinked = useSelect( ( select ) => {
		if ( viewOnlyDashboard && loading ) {
			return undefined;
		}

		return select( MODULES_ANALYTICS_4 ).getAdSenseLinked();
	} );

	if ( ! isAdSenseLinked && ! viewOnlyDashboard ) {
		return (
			<Widget>
				<AdSenseLinkCTA />
			</Widget>
		);
	}

	const { rows = [] } = report || {};

	const columns = [
		{
			field: 'dimensionValues.0.value',
			Component( { fieldValue } ) {
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
			Component( { fieldValue } ) {
				return (
					<strong>
						{ numFmt( fieldValue, {
							style: 'currency',
							currency: report?.metadata?.currencyCode,
						} ) }
					</strong>
				);
			},
		},
	];

	return (
		<MetricTileTable
			Widget={ Widget }
			widgetSlug={ KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT }
			loading={ loading }
			rows={ rows }
			columns={ columns }
			ZeroState={ ZeroDataMessage }
			error={ error }
			moduleSlug="analytics-4"
		/>
	);
}

TopEarningContentWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};

export default compose(
	whenActive( {
		moduleName: 'analytics-4',
		FallbackComponent: ConnectGA4CTATileWidget,
	} ),
	whenActive( {
		moduleName: 'adsense',
		FallbackComponent: ConnectAdSenseCTATileWidget,
	} )
)( TopEarningContentWidget );
