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
import { stringToDate } from '../../../../../util';
import { trackEvent } from '../../../../../util/tracking';
import ReminderBannerNoAccess from './ReminderBannerNoAccess';
import { CORE_MODULES } from '../../../../../googlesitekit/modules/datastore/constants';
import { Cell, Grid, Row } from '../../../../../material-components';
import useViewContext from '../../../../../hooks/useViewContext';
import CheckIcon from '../../../../../../svg/icons/check_circle.svg';

const { useSelect } = Data;

export default function ReminderBanner( props ) {
	const { isDismissed, onSubmitSuccess, children } = props;

	const hasAnalyticsAccess = useSelect( ( select ) => {
		if ( isDismissed ) {
			return undefined;
		}

		return select( CORE_MODULES ).hasModuleOwnershipOrAccess( 'analytics' );
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

	const referenceDate = stringToDate( referenceDateString );

	const eventCategory =
		stringToDate( '2023-07-01' ) <= referenceDate
			? `${ viewContext }_ua-stale-notification`
			: `${ viewContext }_ga4-reminder-notification`;

	useMount( () => {
		if (
			! isTooltipVisible &&
			! ( isLoadingAnalyticsAccess || isDismissed )
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
		'Google Analytics 4 is the newest version of Google Analytics. It will replace Universal Analytics on July 1, 2023. After that, Universal Analytics properties will no longer collect new data.',
		'google-site-kit'
	);

	if ( referenceDate < stringToDate( '2023-06-01' ) ) {
		title = __(
			'Set up Google Analytics 4 now to join the future of Analytics',
			'google-site-kit'
		);
	} else if (
		stringToDate( '2023-06-01' ) <= referenceDate &&
		referenceDate < stringToDate( '2023-07-01' )
	) {
		const remainingDays = 30 - referenceDate.getDate();
		title = sprintf(
			/* translators: %s: Number of days remaining before the user can set up Google Analytics 4 */
			__(
				'You only have %d more days to set up Google Analytics 4',
				'google-site-kit'
			),
			remainingDays
		);
	} else {
		title = __(
			'Universal Analytics stopped collecting data on July 1, 2023',
			'google-site-kit'
		);
		description = __(
			'Set up Google Analytics 4, the new version of Google Analytics, to continue seeing data in Site Kit.',
			'google-site-kit'
		);
	}

	const secondaryPane = (
		<section>
			<h4 className="googlesitekit-publisher-win__secondary-pane-title">
				{ __( 'Google Analytics 4 benefits:', 'google-site-kit' ) }
			</h4>
			<ul className="googlesitekit-publisher-win__secondary-pane-list">
				<li>
					<CheckIcon height={ 18 } width={ 18 } />
					{ __(
						'Full cross-device and cross-platform reporting',
						'google-site-kit'
					) }
				</li>
				<li>
					<CheckIcon height={ 18 } width={ 18 } />
					{ __(
						'Advanced conversion tracking, such as when visitors submit a form or add an item to cart',
						'google-site-kit'
					) }
				</li>
				<li>
					<CheckIcon height={ 18 } width={ 18 } />
					{ __(
						'Detailed insights on how users navigate your site',
						'google-site-kit'
					) }
				</li>
			</ul>
		</section>
	);

	if ( hasAnalyticsAccess === false ) {
		return (
			<ReminderBannerNoAccess
				title={ title }
				description={ description }
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
			learnMoreLabel={ __(
				'Learn more about Google Analytics 4',
				'google-site-kit'
			) }
			learnMoreURL={ documentationURL }
			ctaLabel={ __( 'Set up now', 'google-site-kit' ) }
			ctaLink={ onSubmitSuccess ? '#' : null }
			onCTAClick={ handleCTAClick }
			dismiss={ __( 'Remind me later', 'google-site-kit' ) }
			dismissExpires={ getBannerDismissalExpiryTime(
				referenceDateString
			) }
			secondaryPane={ secondaryPane }
			onDismiss={ handleDismiss }
			onLearnMoreClick={ handleLearnMore }
		>
			{ children }
		</BannerNotification>
	);
}
