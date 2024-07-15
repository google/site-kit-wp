/**
 * GA4AdSenseLinkedNotification component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
 * WordPress dependencies
 */
import { useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../modules/analytics-4/datastore/constants';
import CheckFill from '../../../svg/icons/check-fill.svg';
import { Button } from 'googlesitekit-components';
import { Grid, Cell, Row } from '../../material-components';
import { isZeroReport } from '../../modules/analytics-4/utils';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import useDashboardType from '../../hooks/useDashboardType';
import useViewContext from '../../hooks/useViewContext';
import { trackEvent } from '../../util';
import whenInViewContext from '../../util/when-in-view-context';

export const GA4_ADSENSE_LINKED_NOTIFICATION =
	'ga4_adsense_linked_notification';

function GA4AdSenseLinkedNotification() {
	const dashboardType = useDashboardType();

	const adSenseModuleConnected = useSelect( ( select ) => {
		if ( ! dashboardType ) {
			return null;
		}

		return select( CORE_MODULES ).isModuleConnected( 'adsense' );
	} );

	const analyticsModuleConnected = useSelect( ( select ) => {
		if ( ! dashboardType ) {
			return null;
		}

		return select( CORE_MODULES ).isModuleConnected( 'analytics-4' );
	} );

	const isAdSenseLinked = useSelect( ( select ) => {
		if ( ! dashboardType ) {
			return null;
		}

		return select( MODULES_ANALYTICS_4 ).getAdSenseLinked();
	} );

	const analyticsAndAdsenseConnectedAndLinked =
		adSenseModuleConnected && analyticsModuleConnected && isAdSenseLinked;

	const isDismissed = useSelect( ( select ) => {
		if ( ! dashboardType ) {
			return null;
		}

		return select( CORE_USER ).isItemDismissed(
			GA4_ADSENSE_LINKED_NOTIFICATION
		);
	} );

	const { dismissItem } = useDispatch( CORE_USER );

	const { startDate, endDate } = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const viewContext = useViewContext();

	const reportOptions = {
		startDate,
		endDate,
		dimensions: [ 'pagePath' ],
		metrics: [ { name: 'totalAdRevenue' } ],
		orderby: [
			{
				metric: { metricName: 'totalAdRevenue' },
				desc: true,
			},
		],
		limit: 3,
	};

	const report = useSelect( ( select ) => {
		if ( isDismissed || ! analyticsAndAdsenseConnectedAndLinked ) {
			return null;
		}

		return select( MODULES_ANALYTICS_4 ).getReport( reportOptions );
	} );

	const hasFinishedResolution = useSelect( ( select ) => {
		return select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
			'getReport',
			[ reportOptions ]
		);
	} );

	const dismissNotificationForUser = useCallback( async () => {
		trackEvent(
			`${ viewContext }_top-earning-pages-success-notification`,
			'confirm_notification'
		);
		await dismissItem( GA4_ADSENSE_LINKED_NOTIFICATION );
	}, [ dismissItem, viewContext ] );

	// This notification should only appear when the user has connected their
	// AdSense and Google Analytics accounts, but has not yet received any data
	// from linking the accounts. If they have any data from the "linked" report,
	// we show them a different notification and should not show this one. Check
	// to see if the user already has data and dismiss this notification without
	// showing it.
	useEffect( () => {
		if (
			!! dashboardType &&
			isDismissed === false &&
			hasFinishedResolution &&
			isZeroReport( report ) === false &&
			analyticsAndAdsenseConnectedAndLinked
		) {
			dismissNotificationForUser();
		}
	}, [
		report,
		isDismissed,
		hasFinishedResolution,
		analyticsAndAdsenseConnectedAndLinked,
		dismissNotificationForUser,
		dashboardType,
	] );

	// Ensure resolution of the report has completed before showing this
	// notification, since it should only appear when the user has no data in
	// the report.
	const shouldShowNotification =
		// Only show this notification on the main/entity dashboard, not on the
		// settings page, etc.
		dashboardType &&
		// Don't show this notification if `isDismissed` call is still loading
		// or the user has dismissed it.
		! isDismissed &&
		hasFinishedResolution &&
		isZeroReport( report ) &&
		analyticsAndAdsenseConnectedAndLinked;

	useEffect( () => {
		if ( shouldShowNotification ) {
			trackEvent(
				`${ viewContext }_top-earning-pages-success-notification`,
				'view_notification'
			);
		}
	}, [ shouldShowNotification, viewContext ] );

	if ( ! shouldShowNotification ) {
		return null;
	}

	return (
		<Grid>
			<Row>
				<Cell
					alignMiddle
					size={ 12 }
					className="googlesitekit-subtle-notification"
				>
					<div className="googlesitekit-subtle-notification__icon">
						<CheckFill width={ 24 } height={ 24 } />
					</div>
					<div className="googlesitekit-subtle-notification__content">
						<p>
							{ __(
								'Your AdSense and Analytics accounts are linked.',
								'google-site-kit'
							) }
						</p>
						<p>
							{ __(
								'We’ll let you know as soon as there’s enough data available.',
								'google-site-kit'
							) }
						</p>
					</div>
					<Button tertiary onClick={ dismissNotificationForUser }>
						{ __( 'Got it', 'google-site-kit' ) }
					</Button>
				</Cell>
			</Row>
		</Grid>
	);
}

export default whenInViewContext( { allNonViewOnly: true } )(
	// eslint-disable-next-line sitekit/acronym-case
	GA4AdSenseLinkedNotification
);
