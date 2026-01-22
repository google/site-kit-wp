/**
 * PendingVerification component.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { FC, ElementType } from 'react';

/**
 * Internal dependencies
 */
import NoticeNotification from '@/js/googlesitekit/notifications/components/layout/NoticeNotification';
import { TYPES } from '@/js/components/Notice/constants';

interface PendingVerificationProps {
	id: string;
	Notification: ElementType;
	gaTrackingEventArgs: Record< string, string >;
	dismissNotice: () => void;
	onCTAClick: () => void;
}

const PendingVerification: FC< PendingVerificationProps > = ( {
	id,
	Notification,
	gaTrackingEventArgs,
	dismissNotice,
	onCTAClick,
} ) => {
	return (
		<Notification gaTrackingEventArgs={ gaTrackingEventArgs }>
			{ /* @ts-expect-error - The `NoticeNotification` component is not typed yet. */ }
			<NoticeNotification
				notificationID={ id }
				type={ TYPES.SUCCESS }
				gaTrackingEventArgs={ gaTrackingEventArgs }
				title={ __(
					'Your Reader Revenue Manager account was successfully set up!',
					'google-site-kit'
				) }
				description={ __(
					'Your publication is still awaiting review, you can check its status in Reader Revenue Manager.',
					'google-site-kit'
				) }
				dismissButton={ {
					onClick: dismissNotice,
				} }
				ctaButton={ {
					label: __( 'Check publication status', 'google-site-kit' ),
					onClick: onCTAClick,
					external: true,
				} }
			/>
		</Notification>
	);
};

export default PendingVerification;
