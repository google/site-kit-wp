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
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { DATE_RANGE_OFFSET } from '../../modules/analytics/datastore/constants';
import CheckFill from '../../../svg/icons/check-fill.svg';
import { Button } from 'googlesitekit-components';
import { Grid, Cell, Row } from '../../material-components';
import useViewOnly from '../../hooks/useViewOnly';
import { isZeroReport } from '../../modules/analytics-4/utils';
import { useFeature } from '../../hooks/useFeature';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';

const { useSelect, useInViewSelect, useDispatch } = Data;

export default function GA4AdSenseLinkedNotification() {
	const viewOnly = useViewOnly();

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			GA4_ADSENSE_LINKED_NOTIFICATION_DISMISSED_ITEM_KEY
		)
	);

	const isGA4AdSenseIntegrationEnabled = useFeature(
		'ga4AdSenseIntegration'
	);
	const adSenseModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'adsense' )
	);
	const AnalyticsModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);
	const isAdSenseLinked = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAdSenseLinked()
	);

	const analyticsAndAdsenseConnectedAndLinked =
		adSenseModuleConnected && AnalyticsModuleConnected && isAdSenseLinked;

	const { dismissItem } = useDispatch( CORE_USER );

	const { startDate, endDate } = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const GA4_ADSENSE_LINKED_NOTIFICATION_DISMISSED_ITEM_KEY =
		'ga4_adsense_linked_notification_dimissed_item';

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

	const report = useInViewSelect( ( select ) => {
		if (
			viewOnly ||
			isDismissed ||
			! analyticsAndAdsenseConnectedAndLinked ||
			! isGA4AdSenseIntegrationEnabled
		) {
			return undefined;
		}

		return select( MODULES_ANALYTICS_4 ).getReport( reportOptions );
	} );
	const hasFinishedResolution = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).hasFinishedResolution( 'getReport', [
			reportOptions,
		] )
	);
	const dismissNotificationForUser = useCallback( () => {
		dismissItem( GA4_ADSENSE_LINKED_NOTIFICATION_DISMISSED_ITEM_KEY );
	}, [ dismissItem ] );

	// This notification should only appear when the user has connected their
	// AdSense and Google Analytics accounts, but has not yet received any data
	// from linking the accounts. If they have any data from the "linked" report,
	// we show them a different notification and should not show this one. Check
	// to see if the user already has data and dismiss this notification without
	// showing it.
	useEffect( () => {
		if (
			hasFinishedResolution &&
			! isZeroReport( report ) &&
			! isDismissed &&
			! viewOnly &&
			analyticsAndAdsenseConnectedAndLinked &&
			! isGA4AdSenseIntegrationEnabled
		) {
			dismissNotificationForUser();
		}
	}, [
		report,
		isDismissed,
		viewOnly,
		hasFinishedResolution,
		analyticsAndAdsenseConnectedAndLinked,
		isGA4AdSenseIntegrationEnabled,
		dismissNotificationForUser,
	] );

	// Ensure resolution of the report has completed before showing this notification, since
	// it should only appear when the user has no data in the report.
	if (
		viewOnly ||
		isDismissed ||
		! isZeroReport( report ) ||
		! hasFinishedResolution ||
		! analyticsAndAdsenseConnectedAndLinked ||
		! isGA4AdSenseIntegrationEnabled
	) {
		return null;
	}

	return (
		<Grid>
			<Row>
				<Cell
					alignMiddle
					size={ 12 }
					className="googlesitekit-subtle-notifications"
				>
					<div className="googlesitekit-subtle-notifications__icon">
						<CheckFill width={ 24 } height={ 24 } />
					</div>
					<div className="googlesitekit-subtle-notifications__content">
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
