/**
 * SetupUsingProxyWithSignIn SplashSetupErrorMessageNotification component.
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
import { ElementType } from 'react';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import Link from '@/js/components/Link';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';

type SplashSetupErrorMessageNotificationCopyMap = Record<
	'connection' | 'permissions',
	{
		ctaLabel: string;
		description: string;
		title: string;
	}
>;

interface SplashSetupErrorMessageNotificationProps {
	Notification: ElementType;
}

export default function SplashSetupErrorMessageNotification( {
	Notification,
}: SplashSetupErrorMessageNotificationProps ) {
	const setupErrorCode = useSelect(
		( select: Select ) => select( CORE_SITE ).getSetupErrorCode(),
		[]
	);

	const setupErrorRedoURL = useSelect(
		( select: Select ) => select( CORE_SITE ).getSetupErrorRedoURL(),
		[]
	);

	const errorTroubleshootingLinkURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getErrorTroubleshootingLinkURL( {
				code: setupErrorCode,
			} ),
		[ setupErrorCode ]
	);

	const copyMap: SplashSetupErrorMessageNotificationCopyMap = {
		connection: {
			ctaLabel: __( 'Retry plugin setup', 'google-site-kit' ),
			description: __(
				'Something went wrong while connecting Site Kit to your site. Try again or <a>get help</a>',
				'google-site-kit'
			),
			title: __( 'Connecting Site Kit failed', 'google-site-kit' ),
		},
		permissions: {
			ctaLabel: __( 'Retry plugin setup', 'google-site-kit' ),
			description: __(
				'Setup wasn’t completed because you didn’t grant the necessary permissions. <a>Get help</a>',
				'google-site-kit'
			),
			title: __( 'Site Kit setup failed', 'google-site-kit' ),
		},
	};

	const variant =
		setupErrorCode === 'access_denied' ? 'permissions' : 'connection';

	const { ctaLabel, description, title } = copyMap[ variant ];

	return (
		<Notification>
			<Notice
				className="googlesitekit-setup__splash-setup-error-message-notification"
				ctaButton={ {
					label: ctaLabel,
					href: setupErrorRedoURL,
				} }
				description={ createInterpolateElement( description, {
					a: <Link href={ errorTroubleshootingLinkURL } external />,
				} ) }
				title={ title }
				type={ NOTICE_TYPES.ERROR }
			/>
		</Notification>
	);
}
