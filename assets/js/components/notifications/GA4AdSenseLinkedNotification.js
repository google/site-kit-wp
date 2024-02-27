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
import {
	MODULES_ANALYTICS_4,
	GA4_ADSENSE_LINKED_NOTIFICATION_DISMISSED_ITEM_KEY,
} from '../../modules/analytics-4/datastore/constants';
import useViewOnly from '../../hooks/useViewOnly';
import CheckFill from '../../../svg/icons/check-fill.svg';
import { Button } from 'googlesitekit-components';
import { Grid, Cell, Row } from '../../material-components';
import { DATE_RANGE_OFFSET } from '../../modules/analytics/datastore/constants';

const { useSelect, useInViewSelect, useDispatch } = Data;

export default function GA4AdSenseLinkedNotification() {
	const viewOnly = useViewOnly();

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			GA4_ADSENSE_LINKED_NOTIFICATION_DISMISSED_ITEM_KEY
		)
	);

	const { dismissItem } = useDispatch( CORE_USER );

	const { startDate, endDate } = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

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
		if ( viewOnly || isDismissed ) {
			return undefined;
		}

		return select( MODULES_ANALYTICS_4 ).getReport( reportOptions );
	} );
	const hasFinishedResolution = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).hasFinishedResolution( 'getReport', [
			reportOptions,
		] )
	);
	const dismissCallback = useCallback( () => {
		dismissItem( GA4_ADSENSE_LINKED_NOTIFICATION_DISMISSED_ITEM_KEY );
	}, [ dismissItem ] );

	useEffect( () => {
		if (
			hasFinishedResolution &&
			report?.rowCount !== null &&
			! isDismissed &&
			! viewOnly
		) {
			dismissCallback();
		}
	}, [
		report,
		isDismissed,
		viewOnly,
		hasFinishedResolution,
		dismissCallback,
	] );

	// Prevent flickering with the last condition, by not displaying the notification
	// until resolution of the report is done.
	if (
		viewOnly ||
		isDismissed ||
		report?.rowCount !== null ||
		! hasFinishedResolution
	) {
		return null;
	}

	return (
		<Grid>
			<Row>
				<Cell
					alignMiddle
					size={ 12 }
					className="googlesitekit-dashboard-notifications"
				>
					<div className="googlesitekit-dashboard-notifications__icon">
						<CheckFill width={ 24 } height={ 24 } />
					</div>
					<div className="googlesitekit-dashboard-notifications__content">
						<div>
							{ __(
								'Your AdSense and Analytics accounts are linked.',
								'google-site-kit'
							) }
						</div>
						<div>
							{ __(
								'We’ll let you know as soon as there’s enough data available.',
								'google-site-kit'
							) }
						</div>
					</div>
					<Button tertiary onClick={ dismissCallback }>
						{ __( 'Got it', 'google-site-kit' ) }
					</Button>
				</Cell>
			</Row>
		</Grid>
	);
}
