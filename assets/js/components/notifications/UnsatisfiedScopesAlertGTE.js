/**
 * UnsatisfiedScopesAlertGTE component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import {
	CORE_USER,
	FORM_TEMPORARY_PERSIST_PERMISSION_ERROR,
} from '../../googlesitekit/datastore/user/constants';
import { READ_SCOPE as TAGMANAGER_READ_SCOPE } from '../../modules/tagmanager/datastore/constants';
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';
import NotificationError from '../../googlesitekit/notifications/components/layout/NotificationError';
import Description from '../../googlesitekit/notifications/components/common/Description';
import LearnMoreLink from '../../googlesitekit/notifications/components/common/LearnMoreLink';
import CTALink from '../../googlesitekit/notifications/components/common/CTALink';

export default function UnsatisfiedScopesAlertGTE( { id, Notification } ) {
	const temporaryPersistedPermissionsError = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			FORM_TEMPORARY_PERSIST_PERMISSION_ERROR,
			'permissionsError'
		)
	);
	const connectURL = useSelect( ( select ) =>
		select( CORE_USER ).getConnectURL( {
			additionalScopes: [ TAGMANAGER_READ_SCOPE ],
			redirectURL:
				temporaryPersistedPermissionsError?.data?.redirectURL ||
				global.location.href,
		} )
	);

	const googleTagLearnMoreURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/tagmanager/answer/11994839',
		} )
	);

	if ( connectURL === undefined ) {
		return null;
	}

	return (
		<Notification className="googlesitekit-publisher-win googlesitekit-publisher-win--win-error">
			<NotificationError
				title={ __(
					'Site Kit needs additional permissions to detect updates to tags on your site',
					'google-site-kit'
				) }
				description={
					<Description
						text={ __(
							'To continue using Analytics with Site Kit, you need to grant permission to check for any changes in your Google tag’s target Analytics property. The Google tag feature was recently updated to allow users to change a tag’s connected Analytics property without editing site code. Because of this change, Site Kit now must regularly check if the tag on your site matches the Analytics property destination.',
							'google-site-kit'
						) }
						learnMoreLink={
							<LearnMoreLink
								id={ id }
								label={ __( 'Learn more', 'google-site-kit' ) }
								url={ googleTagLearnMoreURL }
							/>
						}
					/>
				}
				actions={
					<CTALink
						id={ id }
						ctaLabel={ __( 'Grant permission', 'google-site-kit' ) }
						ctaLink={ connectURL }
					/>
				}
			/>
		</Notification>
	);
}
