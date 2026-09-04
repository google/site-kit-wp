/**
 * TopPagesDrivingSalesWidget component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { ElementType, FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useInViewSelect, useSelect } from 'googlesitekit-data';
import {
	MetricTileTable,
	MetricTileTablePlainText,
} from '@/js/components/KeyMetrics';
import Link from '@/js/components/Link';
import {
	CORE_USER,
	KM_ANALYTICS_TOP_PAGES_DRIVING_SALES,
} from '@/js/googlesitekit/datastore/user/constants';
import useViewOnly from '@/js/hooks/useViewOnly';
import { ZeroDataMessage } from '@/js/modules/analytics-4/components/common';
import {
	GOAL_DRIVER_IDS,
	GOAL_DRIVER_ROW_LIMIT_COLLAPSED,
	GOAL_DRIVER_ROW_LIMIT_EXPANDED,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import {
	GOAL_DRIVER_REPORT_OPTIONS_BUILDERS,
	GOAL_DRIVER_ROW_MAPPERS,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/reports';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { decodeAmpersand } from '@/js/modules/analytics-4/utils';
import whenActive from '@/js/util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';

interface TopPagesDrivingSalesWidgetProps {
	Widget: ElementType;
}

type GoalDriverPageRow = {
	label: string;
	value: string | number;
	pagePath?: string;
};

interface GoalDriverTileColumnProps {
	row: Record< string, unknown >;
	fieldValue?: unknown;
}

const TopPagesDrivingSalesWidget: FC< TopPagesDrivingSalesWidgetProps > = ( {
	Widget,
} ) => {
	const viewOnlyDashboard = useViewOnly();

	const dates = useSelect(
		( select: Select ) => select( CORE_USER ).getDateRangeDates(),
		[]
	);

	// This tile is purchase-specific ("Top pages driving sales"), so the
	// primary event is always `purchase` rather than
	// `getPrimaryEcommerceEvent()`'s detected fallback to `add_to_cart` -
	// otherwise the tile would silently start showing add-to-cart data under
	// a "sales" label.
	const reportOptions = GOAL_DRIVER_REPORT_OPTIONS_BUILDERS[
		GOAL_DRIVER_IDS.TOP_PAGES
	]( {
		dates,
		primaryEvent: ENUM_CONVERSION_EVENTS.PURCHASE,
		limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
	} );

	const report = useInViewSelect(
		( select: Select ) =>
			reportOptions
				? select( MODULES_ANALYTICS_4 ).getReport( reportOptions )
				: undefined,
		[ reportOptions ]
	);

	const titles = useInViewSelect(
		( select: Select ) =>
			report && reportOptions
				? select( MODULES_ANALYTICS_4 ).getPageTitles(
						report,
						reportOptions
				  )
				: undefined,
		[ report, reportOptions ]
	);

	const error = useSelect(
		( select: Select ) =>
			reportOptions
				? select( MODULES_ANALYTICS_4 ).getErrorForSelector(
						'getReport',
						[ reportOptions ]
				  )
				: undefined,
		[ reportOptions ]
	);

	const loading = useSelect(
		( select: Select ) => {
			if ( ! reportOptions ) {
				return true;
			}

			if (
				! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
					'getReport',
					[ reportOptions ]
				)
			) {
				return true;
			}

			return ( report?.rows || [] ).length > 0 && titles === undefined;
		},
		[ report, reportOptions, titles ]
	);

	const rows: GoalDriverPageRow[] = GOAL_DRIVER_ROW_MAPPERS[
		GOAL_DRIVER_IDS.TOP_PAGES
	]( report?.rows || [] ).map( ( row ) => {
		const rawPageTitle = row.pagePath
			? titles?.[ row.pagePath ]
			: undefined;
		const pageTitle = rawPageTitle
			? decodeAmpersand( rawPageTitle ).trim()
			: undefined;

		return {
			...row,
			label:
				! pageTitle ||
				pageTitle === __( '(unknown)', 'google-site-kit' )
					? row.label
					: pageTitle,
		};
	} );

	const columns = [
		{
			field: 'label',
			Component( { row }: GoalDriverTileColumnProps ) {
				const pagePath = row.pagePath as string | undefined;
				const label = row.label as string;

				const serviceURL = useSelect(
					( select: Select ) => {
						if ( viewOnlyDashboard || ! pagePath ) {
							return null;
						}

						return select(
							MODULES_ANALYTICS_4
						).getServiceReportURL( 'all-pages-and-screens', {
							filters: {
								unifiedPagePathScreen: pagePath,
							},
							dates,
						} );
					},
					[ pagePath, dates ]
				);

				if ( viewOnlyDashboard || ! serviceURL ) {
					return <MetricTileTablePlainText content={ label } />;
				}

				return (
					<Link
						href={ serviceURL }
						title={ label }
						external
						hideExternalIndicator
					>
						{ label }
					</Link>
				);
			},
		},
		{
			field: 'value',
			Component( { fieldValue }: GoalDriverTileColumnProps ) {
				return <strong>{ fieldValue as string }</strong>;
			},
		},
	];

	return (
		<MetricTileTable
			Widget={ Widget }
			widgetSlug={ KM_ANALYTICS_TOP_PAGES_DRIVING_SALES }
			loading={ loading }
			rows={ rows }
			columns={ columns }
			limit={ GOAL_DRIVER_ROW_LIMIT_COLLAPSED }
			ZeroState={ ZeroDataMessage }
			error={ error }
			moduleSlug="analytics-4"
		/>
	);
};

export default whenActive( {
	moduleName: MODULE_SLUG_ANALYTICS_4,
	FallbackComponent: ConnectGA4CTATileWidget,
} )( TopPagesDrivingSalesWidget );
