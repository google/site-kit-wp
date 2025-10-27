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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import NoticeNotification from '@/js/googlesitekit/notifications/components/layout/NoticeNotification';
import { TYPES } from '@/js/components/Notice/constants';
import Typography from '@/js/components/Typography';
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { MODULES_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/datastore/constants';
import { getErrorMessages } from '@/js/modules/sign-in-with-google/components/setup/CompatibilityChecks/utils';

const CONFLICTING_PLUGINS_ERROR_SLUG = 'conflicting_plugins';

export default function CompatibilityWarningSubtleNotification( {
	id,
	Notification,
} ) {
	const compatibilityChecks = useSelect( ( select ) =>
		select( MODULES_SIGN_IN_WITH_GOOGLE ).getCompatibilityChecks()
	);
	const errors = useMemo(
		() => compatibilityChecks?.checks || {},
		[ compatibilityChecks ]
	);
	const errorMessages = useMemo(
		() => getErrorMessages( errors ),
		[ errors ]
	);

	const pluginsAdminURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL()
	);

	const hasConflictingPluginsError =
		!! errors[ CONFLICTING_PLUGINS_ERROR_SLUG ];

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
				type={ TYPES.WARNING }
				title={ __(
					'Potential issues with Sign in with Google detected',
					'google-site-kit'
				) }
				description={ errorMessages.map( ( message, index ) => (
					<Typography key={ `${ index }-${ message }` }>
						{ message }
					</Typography>
				) ) }
				dismissButton={ {
					label: __( 'Dismiss', 'google-site-kit' ),
				} }
				ctaButton={ ctaButton }
			/>
		</Notification>
	);
}

CompatibilityWarningSubtleNotification.propTypes = {
	id: PropTypes.string.isRequired,
	Notification: PropTypes.elementType.isRequired,
};
