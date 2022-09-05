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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { ACTIVATION_ACKNOWLEDGEMENT_TOOLTIP_STATE_KEY } from '../../../constants';
import BannerNotification from '../../../../../components/notifications/BannerNotification';
import { useTooltipState } from '../../../../../components/AdminMenuTooltip/useTooltipState';
import { useShowTooltip } from '../../../../../components/AdminMenuTooltip/useShowTooltip';
import { AdminMenuTooltip } from '../../../../../components/AdminMenuTooltip/AdminMenuTooltip';
import { getBannerDismissalExpiryTime } from '../../../utils/banner-dismissal-expiry';
const { useSelect } = Data;

export default function ReminderBanner( { onCTAClick } ) {
	const referenceDateString = useSelect( ( select ) =>
		select( CORE_USER ).getReferenceDate()
	);

	const { isTooltipVisible } = useTooltipState(
		ACTIVATION_ACKNOWLEDGEMENT_TOOLTIP_STATE_KEY
	);

	const showTooltip = useShowTooltip(
		ACTIVATION_ACKNOWLEDGEMENT_TOOLTIP_STATE_KEY
	);

	if ( isTooltipVisible ) {
		return (
			<Fragment>
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
					tooltipStateKey={
						ACTIVATION_ACKNOWLEDGEMENT_TOOLTIP_STATE_KEY
					}
				/>
			</Fragment>
		);
	}

	return (
		<BannerNotification
			id="ga4-activation-banner"
			title={ __(
				'Set up Google Analytics 4 now to join the future of Analytics',
				'google-site-kit'
			) }
			/* TODO: Internationalize title below */
			description={ 'Placeholder description text to replace.' }
			ctaLabel={ __( 'Set up now', 'google-site-kit' ) }
			ctaLink={ onCTAClick ? '#' : null }
			onCTAClick={ onCTAClick }
			dismiss={ __( 'Remind me later', 'google-site-kit' ) }
			dismissExpires={ getBannerDismissalExpiryTime(
				referenceDateString
			) }
			onDismiss={ showTooltip }
		/>
	);
}
