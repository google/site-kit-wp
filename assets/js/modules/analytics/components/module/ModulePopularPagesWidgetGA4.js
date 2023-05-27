/**
 * ModulePopularPagesWidgetGA4 component.
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
import { cloneDeep } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { DATE_RANGE_OFFSET } from '../../datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import { numFmt, trackEvent } from '../../../../util';
import whenActive from '../../../../util/when-active';
import TableOverflowContainer from '../../../../components/TableOverflowContainer';
import DetailsPermaLinks from '../../../../components/DetailsPermaLinks';
import ReportTable from '../../../../components/ReportTable';
import PreviewTable from '../../../../components/PreviewTable';
import { ZeroDataMessage } from '../common';
import Header from './ModulePopularPagesWidget/Header';
import Footer from './ModulePopularPagesWidget/Footer';
import useViewOnly from '../../../../hooks/useViewOnly';
import useViewContext from '../../../../hooks/useViewContext';
import NewBadge from '../../../../components/NewBadge';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import ga4ReportingTour from '../../../../feature-tours/ga4-reporting';
const { useSelect, useInViewSelect } = Data;

function ModulePopularPagesWidgetGA4( props ) {
	const { Widget, WidgetReportError } = props;

	const isGatheringData = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isGatheringData()
	);

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const viewOnlyDashboard = useViewOnly();
	const viewContext = useViewContext();

	const args = {
		...dates,
		dimensions: [ 'pagePath' ],
		metrics: [
			{
				name: 'screenPageViews',
			},
			{
				name: 'sessions',
			},
			{
				name: 'engagementRate',
			},
			{
				name: 'averageSessionDuration',
			},
		],
		orderby: [
			{
				metric: {
					metricName: 'screenPageViews',
				},
				desc: true,
			},
		],
		limit: 10,
	};

	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			args,
		] )
	);

	const report = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getReport( args )
	);

	const titles = useInViewSelect( ( select ) =>
		! error
			? select( MODULES_ANALYTICS_4 ).getPageTitles( report, args )
			: undefined
	);

	const loaded = useSelect( ( select ) => {
		const reportLoaded = select(
			MODULES_ANALYTICS_4
		).hasFinishedResolution( 'getReport', [ args ] );

		return undefined !== error || ( reportLoaded && undefined !== titles );
	} );

	const sessionsLearnMoreURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/analytics/answer/9191807',
		} )
	);

	const engagementRateLearnMoreURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/analytics/answer/12195621',
		} )
	);

	const isGA4ReportingTourActive = useSelect(
		( select ) => select( CORE_USER ).getCurrentTour() === ga4ReportingTour
	);

	const loading = ! loaded || isGatheringData === undefined;

	const onGA4NewBadgeLearnMoreClick = useCallback( () => {
		trackEvent( `${ viewContext }_ga4-new-badge`, 'click_learn_more_link' );
	}, [ viewContext ] );

	// Bypass loading state if showing GA4 tour.
	if ( loading && ! isGA4ReportingTourActive ) {
		return (
			<Widget Header={ Header } Footer={ Footer } noPadding>
				<PreviewTable padding />
			</Widget>
		);
	}

	if ( error ) {
		return (
			<Widget Header={ Header } Footer={ Footer }>
				<WidgetReportError moduleSlug="analytics-4" error={ error } />
			</Widget>
		);
	}

	const tableColumns = [
		{
			title: __( 'Title', 'google-site-kit' ),
			description: __( 'Page Title', 'google-site-kit' ),
			primary: true,
			Component: ( { row } ) => {
				const [ { value: title }, { value: url } ] =
					row.dimensionValues;
				const serviceURL = useSelect( ( select ) => {
					if ( viewOnlyDashboard ) {
						return null;
					}

					return select( MODULES_ANALYTICS_4 ).getServiceReportURL(
						'all-pages-and-screens',
						{
							filters: { unifiedPagePathScreen: url },
							dates,
						}
					);
				} );

				return (
					<DetailsPermaLinks
						title={ title }
						path={ url }
						serviceURL={ serviceURL }
					/>
				);
			},
		},
		{
			title: __( 'Pageviews', 'google-site-kit' ),
			description: __( 'Pageviews', 'google-site-kit' ),
			field: 'metricValues.0.value',
			Component: ( { fieldValue } ) => (
				<span>{ numFmt( fieldValue, { style: 'decimal' } ) }</span>
			),
		},
		{
			title: __( 'Sessions', 'google-site-kit' ),
			description: __( 'Sessions', 'google-site-kit' ),
			hideOnMobile: true,
			field: 'metricValues.1.value',
			className: 'googlesitekit-table__head-item--sessions',
			Component: ( { fieldValue } ) => (
				<span>{ numFmt( fieldValue, { style: 'decimal' } ) }</span>
			),
			badge: (
				<NewBadge
					tooltipTitle={ __(
						'Visitor interactions with your site within a given time frame (30 min by default).',
						'google-site-kit'
					) }
					learnMoreLink={ sessionsLearnMoreURL }
					onLearnMoreClick={ onGA4NewBadgeLearnMoreClick }
				/>
			),
		},
		{
			title: __( 'Engagement Rate', 'google-site-kit' ),
			description: __( 'Engagement Rate', 'google-site-kit' ),
			hideOnMobile: true,
			field: 'metricValues.2.value',
			className: 'googlesitekit-table__head-item--engagement-rate',
			Component: ( { fieldValue } ) => (
				<span>{ numFmt( fieldValue, '%' ) }</span>
			),
			badge: (
				<NewBadge
					tooltipTitle={ __(
						'Sessions which lasted 10 seconds or longer, had 1 or more conversion events, or 2 or more page views.',
						'google-site-kit'
					) }
					learnMoreLink={ engagementRateLearnMoreURL }
					onLearnMoreClick={ onGA4NewBadgeLearnMoreClick }
				/>
			),
		},
		{
			title: __( 'Session Duration', 'google-site-kit' ),
			description: __( 'Session Duration', 'google-site-kit' ),
			hideOnMobile: true,
			field: 'metricValues.3.value',
			Component: ( { fieldValue } ) => (
				<span>{ numFmt( fieldValue, 's' ) }</span>
			),
		},
	];

	let rows = report?.rows?.length ? cloneDeep( report.rows ) : [];
	let ZeroState = ZeroDataMessage;
	// Use a custom zero state when the GA4 reporting tour is active
	// while data is still loading.
	if ( loading && isGA4ReportingTourActive ) {
		rows = [];
		ZeroState = () => <PreviewTable rows={ rows.length || 10 } />;
	} else {
		// Combine the titles from the pageTitles with the rows from the metrics report.
		rows.forEach( ( row ) => {
			const url = row.dimensionValues[ 0 ].value;
			row.dimensionValues.unshift( { value: titles[ url ] } ); // We always have an entry for titles[url].
		} );
	}

	return (
		<Widget Header={ Header } Footer={ Footer } noPadding>
			<TableOverflowContainer>
				<ReportTable
					rows={ rows }
					columns={ tableColumns }
					zeroState={ ZeroState }
					gatheringData={ isGatheringData }
				/>
			</TableOverflowContainer>
		</Widget>
	);
}

ModulePopularPagesWidgetGA4.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetReportError: PropTypes.elementType.isRequired,
	WidgetReportZero: PropTypes.elementType.isRequired,
};

export default whenActive( { moduleName: 'analytics-4' } )(
	ModulePopularPagesWidgetGA4
);
