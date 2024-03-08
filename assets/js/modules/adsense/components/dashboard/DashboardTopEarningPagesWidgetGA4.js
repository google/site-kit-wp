/**
 * AdBlockerWarningWidget component.
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
import { useIntersection } from 'react-use';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { __, _x } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Link from '../../../../components/Link';
import PreviewTable from '../../../../components/PreviewTable';
import ReportTable from '../../../../components/ReportTable';
import SourceLink from '../../../../components/SourceLink';
import TableOverflowContainer from '../../../../components/TableOverflowContainer';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import useViewOnly from '../../../../hooks/useViewOnly';
import { numFmt, trackEvent } from '../../../../util';
import whenActive from '../../../../util/when-active';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../../analytics-4/datastore/constants';
import { ZeroDataMessage } from '../../../analytics-4/components/common';
import { generateDateRangeArgs } from '../../../analytics-4/utils/report-date-range-args';
import { ADSENSE_GA4_TOP_EARNING_PAGES_NOTICE_DISMISSED_ITEM_KEY as DISMISSED_KEY } from '../../constants';
import { MODULES_ADSENSE } from '../../datastore/constants';
import { AdSenseLinkCTA } from '../common';
import AdBlockerWarning from '../common/AdBlockerWarning';
import useViewContext from '../../../../hooks/useViewContext';

const { useSelect, useInViewSelect } = Data;

function DashboardTopEarningPagesWidgetGA4( {
	WidgetNull,
	WidgetReportError,
	Widget,
} ) {
	const viewOnlyDashboard = useViewOnly();

	const isGatheringData = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isGatheringData()
	);

	const { startDate, endDate } = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const adSenseAccountID = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAccountID()
	);

	const args = {
		startDate,
		endDate,
		dimensions: [ 'pagePath', 'adSourceName' ],
		metrics: [ { name: 'totalAdRevenue' } ],
		filter: {
			fieldName: 'adSourceName',
			stringFilter: {
				matchType: 'EXACT',
				value: `Google AdSense account (${ adSenseAccountID })`,
			},
		},
		orderby: [ { metric: { metricName: 'totalAdRevenue' }, desc: true } ],
		limit: 5,
	};

	const data = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getReport( args )
	);

	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			args,
		] )
	);

	const titles = useInViewSelect( ( select ) =>
		! error
			? select( MODULES_ANALYTICS_4 ).getPageTitles( data, args )
			: undefined
	);

	const loading = useSelect(
		( select ) =>
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ args ]
			) ||
			( ! error && titles === undefined )
	);

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed( DISMISSED_KEY )
	);

	const analyticsMainURL = useSelect( ( select ) => {
		if ( viewOnlyDashboard ) {
			return null;
		}
		return select( MODULES_ANALYTICS_4 ).getServiceReportURL(
			'content-publisher-overview',
			generateDateRangeArgs( { startDate, endDate } )
		);
	} );

	const isAdSenseLinked = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAdSenseLinked()
	);

	const isAdblockerActive = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).isAdBlockerActive()
	);

	const trackingRef = useRef();

	// This function works around the fact that useRef does not trigger a re-render when its value changes.
	// This meant that if you scrolled slowly, the trackingRef would be null when the intersection observer
	// was created, and the observer would never detect the component as in view.
	// Full discussion: https://github.com/google/site-kit-wp/issues/8212#issuecomment-1954275748
	const [ trackingRefReady, setTrackingRefReady ] = useState( false );
	const updateTrackingRef = ( element ) => {
		trackingRef.current = element;
		if ( element && ! trackingRefReady ) {
			setTrackingRefReady( true );
		}
	};

	const viewContext = useViewContext();

	const intersectionEntry = useIntersection( trackingRef, {
		threshold: 0.25,
	} );
	const [ hasBeenInView, setHasBeenInView ] = useState( false );
	const inView = !! intersectionEntry?.intersectionRatio;

	useEffect( () => {
		if ( inView && ! hasBeenInView ) {
			if ( isAdSenseLinked ) {
				trackEvent(
					`${ viewContext }_top-earning-pages-widget`,
					'view_widget'
				);
			}

			if ( ! isAdSenseLinked ) {
				trackEvent(
					`${ viewContext }_top-earning-pages-widget`,
					'view_notification'
				);
			}

			setHasBeenInView( true );
		}
	}, [ inView, viewContext, isAdSenseLinked, hasBeenInView ] );

	const onClickAdSenseLinkedCTA = () => {
		trackEvent(
			`${ viewContext }_top-earning-pages-widget`,
			'click_learn_more_link'
		);
	};

	if ( isDismissed ) {
		return <WidgetNull />;
	}

	if ( ! isAdSenseLinked && viewOnlyDashboard ) {
		return <WidgetNull />;
	}

	if ( isAdblockerActive ) {
		return (
			<Widget Footer={ Footer }>
				<AdBlockerWarning />
			</Widget>
		);
	}

	if ( loading || isGatheringData === undefined ) {
		return (
			<Widget noPadding Footer={ Footer }>
				<PreviewTable rows={ 5 } padding />
			</Widget>
		);
	}

	if ( ! isAdSenseLinked && ! viewOnlyDashboard ) {
		return (
			<Widget Footer={ Footer } ref={ updateTrackingRef }>
				<AdSenseLinkCTA onClick={ onClickAdSenseLinkedCTA } />
			</Widget>
		);
	}

	if ( error ) {
		return (
			<Widget Footer={ Footer }>
				<WidgetReportError moduleSlug="analytics-4" error={ error } />
			</Widget>
		);
	}

	function Footer() {
		return (
			<SourceLink
				className="googlesitekit-data-block__source"
				name={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
				href={ analyticsMainURL }
				external
			/>
		);
	}

	const tableColumns = [
		{
			title: __( 'Top Earning Pages', 'google-site-kit' ),
			tooltip: __( 'Top Earning Pages', 'google-site-kit' ),
			primary: true,
			Component( { row } ) {
				const [ { value: url } ] = row.dimensionValues;
				const title = titles[ url ];

				const serviceURL = useSelect( ( select ) => {
					return ! viewOnlyDashboard
						? select( MODULES_ANALYTICS_4 ).getServiceReportURL(
								'all-pages-and-screens',
								{
									filters: {
										unifiedPagePathScreen: url,
									},
									dates: {
										startDate,
										endDate,
									},
								}
						  )
						: null;
				} );

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
			title: __( 'Earnings', 'google-site-kit' ),
			tooltip: __( 'Earnings', 'google-site-kit' ),
			field: 'metricValues.0.value',
			Component( { fieldValue } ) {
				return (
					<span>
						{ numFmt( fieldValue, {
							style: 'currency',
							currency: data?.metadata?.currencyCode,
						} ) }
					</span>
				);
			},
		},
	];

	return (
		<Widget noPadding Footer={ Footer } ref={ updateTrackingRef }>
			<TableOverflowContainer>
				<ReportTable
					rows={ data?.rows || [] }
					columns={ tableColumns }
					zeroState={ ZeroDataMessage }
					gatheringData={ isGatheringData }
				/>
			</TableOverflowContainer>
		</Widget>
	);
}

DashboardTopEarningPagesWidgetGA4.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType.isRequired,
	WidgetReportError: PropTypes.elementType.isRequired,
};

export default compose(
	whenActive( { moduleName: 'adsense' } ),
	whenActive( { moduleName: 'analytics-4' } )
)( DashboardTopEarningPagesWidgetGA4 );
