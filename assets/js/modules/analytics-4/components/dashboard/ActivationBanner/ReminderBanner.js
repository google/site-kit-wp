/**
 * ReminderBanner component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { ProgressBar } from 'googlesitekit-components';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { ACTIVATION_ACKNOWLEDGEMENT_TOOLTIP_STATE_KEY } from '../../../constants';
import BannerNotification from '../../../../../components/notifications/BannerNotification';
import { useTooltipState } from '../../../../../components/AdminMenuTooltip/useTooltipState';
import { useShowTooltip } from '../../../../../components/AdminMenuTooltip/useShowTooltip';
import { AdminMenuTooltip } from '../../../../../components/AdminMenuTooltip/AdminMenuTooltip';
import { getBannerDismissalExpiryTime } from '../../../utils/banner-dismissal-expiry';
import Link from '../../../../../components/Link';
import { stringToDate } from '../../../../../util';
import { trackEvent } from '../../../../../util/tracking';
import InfoIcon from '../../../../../../svg/icons/info.svg';
import ErrorIcon from '../../../../../../svg/icons/error.svg';
import ReminderBannerNoAccess from './ReminderBannerNoAccess';
import { CORE_MODULES } from '../../../../../googlesitekit/modules/datastore/constants';
import { Cell, Grid, Row } from '../../../../../material-components';
import { MODULES_ANALYTICS } from '../../../../analytics/datastore/constants';
import useViewContext from '../../../../../hooks/useViewContext';

const { useSelect } = Data;

export default function ReminderBanner( {
	isDismissed,
	onSubmitSuccess,
	children,
} ) {
	const hasAnalyticsAccess = useSelect( ( select ) => {
		if ( isDismissed ) {
			return undefined;
		}
		const userID = select( CORE_USER ).getID();
		const analyticsOwnerID = select( MODULES_ANALYTICS ).getOwnerID();

		if ( userID === undefined || analyticsOwnerID === undefined ) {
			return undefined;
		}

		if ( analyticsOwnerID === userID ) {
			return true;
		}

		return select( CORE_MODULES ).hasModuleAccess( 'analytics' );
	} );
	const isLoadingAnalyticsAccess = useSelect( ( select ) =>
		select( CORE_MODULES ).isResolving( 'hasModuleAccess', [ 'analytics' ] )
	);

	const referenceDateString = useSelect( ( select ) =>
		select( CORE_USER ).getReferenceDate()
	);

	const documentationURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL( 'ga4' );
	} );

	const { isTooltipVisible } = useTooltipState(
		ACTIVATION_ACKNOWLEDGEMENT_TOOLTIP_STATE_KEY
	);

	const showTooltip = useShowTooltip(
		ACTIVATION_ACKNOWLEDGEMENT_TOOLTIP_STATE_KEY
	);

	const viewContext = useViewContext();
	const eventCategory = `${ viewContext }_ga4-reminder-notification`;

	useMount( () => {
		if (
			! isTooltipVisible &&
			( ! isLoadingAnalyticsAccess || isDismissed )
		) {
			trackEvent( eventCategory, 'view_notification' );
		}
	} );

	const handleCTAClick = useCallback( async () => {
		await trackEvent( eventCategory, 'confirm_notification' );
		return onSubmitSuccess();
	}, [ eventCategory, onSubmitSuccess ] );

	const handleDismiss = useCallback( async () => {
		await trackEvent( eventCategory, 'dismiss_notification' );
		showTooltip();
	}, [ eventCategory, showTooltip ] );

	const handleLearnMore = useCallback( () => {
		trackEvent( eventCategory, 'click_learn_more_link' );
	}, [ eventCategory ] );

	if ( isTooltipVisible ) {
		return (
			<AdminMenuTooltip
				title={ __(
					'You can connect Google Analytics 4 later here',
					'google-site-kit'
				) }
				content={ __(
					'You can configure the Google Analytics 4 property inside the Site Kit Settings later.',
					'google-site-kit'
				) }
				dismissLabel={ __( 'Got it', 'google-site-kit' ) }
				tooltipStateKey={ ACTIVATION_ACKNOWLEDGEMENT_TOOLTIP_STATE_KEY }
			/>
		);
	}

	if ( isLoadingAnalyticsAccess && ! isDismissed ) {
		// Wrap in the googlesitekit-publisher-win class to ensure the ProgressBar is treated in the
		// same way as a BannerNotification, with only one instance visible on the screen at a time.
		return (
			<div className="googlesitekit-publisher-win">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							<ProgressBar />
						</Cell>
					</Row>
				</Grid>
			</div>
		);
	}

	let title;
	let description = __(
		'Your current Universal Analytics will stop recording stats on July 1st, 2023',
		'google-site-kit'
	);
	let descriptionIcon = (
		<ErrorIcon
			height="14"
			width="14"
			className="googlesitekit-ga4-reminder-banner__description-icon googlesitekit-ga4-reminder-banner__description-icon--error"
		/>
	);

	const referenceDate = stringToDate( referenceDateString );

	if ( referenceDate < stringToDate( '2023-06-01' ) ) {
		title = __(
			'Set up Google Analytics 4 now to join the future of Analytics',
			'google-site-kit'
		);
		if ( hasAnalyticsAccess ) {
			descriptionIcon = (
				<InfoIcon
					height="14"
					width="14"
					className="googlesitekit-ga4-reminder-banner__description-icon googlesitekit-ga4-reminder-banner__description-icon--info"
				/>
			);
		}
	} else if (
		stringToDate( '2023-06-01' ) <= referenceDate &&
		referenceDate < stringToDate( '2023-07-01' )
	) {
		const remainingDays = 30 - referenceDate.getDate();
		title = sprintf(
			/* translators: %s: Number of days remaining before the user can setup Google Analytics 4 */
			__(
				'You only have %d more days to setup Google Analytics 4',
				'google-site-kit'
			),
			remainingDays
		);
	} else {
		title = __(
			'Your current Universal Analytics stopped recording stats on July 1st, 2023',
			'google-site-kit'
		);
		description = __(
			'Set up Google Analytics 4 now to resume recording stats',
			'google-site-kit'
		);
	}

	const secondaryPane = (
		<section>
			<ul>
				<li>
					{ __(
						'Full cross-device and cross-platform reporting',
						'google-site-kit'
					) }
				</li>
				<li>
					{ __(
						'Set up advanced conversion tracking, e.g. when visitors submit a form or add an item to cart',
						'google-site-kit'
					) }
				</li>
				<li>
					{ __(
						'Get detailed insights on how users navigate your site',
						'google-site-kit'
					) }
				</li>
			</ul>
			<Link
				onClick={ handleLearnMore }
				href={ documentationURL }
				external
			>
				{ __( 'Learn more about GA4', 'google-site-kit' ) }
			</Link>
		</section>
	);

	if ( hasAnalyticsAccess === false ) {
		return (
			<ReminderBannerNoAccess
				title={ title }
				description={ description }
				descriptionIcon={ descriptionIcon }
				dismissExpires={ getBannerDismissalExpiryTime(
					referenceDateString
				) }
				onDismiss={ handleDismiss }
			/>
		);
	}

	return (
		<BannerNotification
			id="ga4-activation-banner"
			className="googlesitekit-ga4-reminder-banner"
			title={ title }
			description={ description }
			descriptionIcon={ descriptionIcon }
			ctaLabel={ __( 'Set up now', 'google-site-kit' ) }
			ctaLink={ onSubmitSuccess ? '#' : null }
			onCTAClick={ handleCTAClick }
			dismiss={ __( 'Remind me later', 'google-site-kit' ) }
			dismissExpires={ getBannerDismissalExpiryTime(
				referenceDateString
			) }
			secondaryPane={ secondaryPane }
			onDismiss={ handleDismiss }
		>
			{ children }
		</BannerNotification>
	);
}
