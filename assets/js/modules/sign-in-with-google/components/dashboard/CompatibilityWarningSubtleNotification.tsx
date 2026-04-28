/**
 * CompatibilityWarningSubtleNotification component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { ElementType, FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import NoticeNotification from '@/js/googlesitekit/notifications/components/layout/NoticeNotification';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { MODULES_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/datastore/constants';
import CompatibilityErrors from '@/js/modules/sign-in-with-google/components/common/CompatibilityErrors';
import { SignInWithGoogleCompatibilityErrors } from '@/js/modules/sign-in-with-google/components/types';

interface CompatibilityWarningSubtleNotificationProps {
	id: string;
	Notification: ElementType;
}

const CompatibilityWarningSubtleNotification: FC<
	CompatibilityWarningSubtleNotificationProps
> = ( { id, Notification } ) => {
	const compatibilityChecks = useSelect( ( select ) => {
		return select(
			MODULES_SIGN_IN_WITH_GOOGLE
			// @ts-expect-error Data store is not yet typed.
		).getCompatibilityChecks() as
			| undefined
			| {
					checks: SignInWithGoogleCompatibilityErrors;
					timestamp: number;
			  };
	}, [] );

	const pluginsAdminURL = useSelect( ( select ) => {
		// @ts-expect-error Data store is not yet typed.
		return select( CORE_SITE ).getAdminURL();
	}, [] );

	const errors = compatibilityChecks?.checks || {};
	const hasConflictingPluginsError = !! errors?.conflicting_plugins;

	const ctaButton =
		hasConflictingPluginsError && pluginsAdminURL
			? {
					label: __( 'Manage plugins', 'google-site-kit' ),
					href: `${ pluginsAdminURL }/plugins.php`,
			  }
			: undefined;

	return (
		<Notification>
			<NoticeNotification
				notificationID={ id }
				type={ NOTICE_TYPES.WARNING }
				title={ __(
					'Potential issues with Sign in with Google detected',
					'google-site-kit'
				) }
				dismissButton={ {
					label: __( 'Dismiss', 'google-site-kit' ),
				} }
				ctaButton={ ctaButton }
			>
				<CompatibilityErrors errors={ errors } />
			</NoticeNotification>
		</Notification>
	);
};
export default CompatibilityWarningSubtleNotification;
