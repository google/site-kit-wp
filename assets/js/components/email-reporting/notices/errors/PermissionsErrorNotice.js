/**
 * PermissionsErrorNotice component.
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { useSelect } from '@/js/googlesitekit-data';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import useNotificationEvents from '@/js/googlesitekit/notifications/hooks/useNotificationEvents';
import withIntersectionObserver from '@/js/util/withIntersectionObserver';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';

export const EMAIL_REPORTS_PERMISSIONS_ERROR_NOTICE =
	'email_reports_permissions_error_notice';

const NoticeWithIntersectionObserver = withIntersectionObserver( Notice );

export default function PermissionsErrorNotice( { moduleSlug } ) {
	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( moduleSlug )
	);

	const storeName = useSelect( ( select ) =>
		select( CORE_MODULES ).getModuleStoreName( moduleSlug )
	);

	const requestAccessURL = useSelect( ( select ) =>
		select( storeName )?.getServiceEntityAccessURL?.()
	);

	const getHelpURL = useSelect( ( select ) =>
		select( CORE_SITE ).getErrorTroubleshootingLinkURL( {
			code: `${ moduleSlug }_insufficient_permissions`,
		} )
	);

	const trackEvents = useNotificationEvents(
		EMAIL_REPORTS_PERMISSIONS_ERROR_NOTICE
	);

	return (
		<NoticeWithIntersectionObserver
			className="googlesitekit-email-reporting__admin-settings-notice"
			type={ NOTICE_TYPES.ERROR }
			title={ __(
				'Email reports are failing to send',
				'google-site-kit'
			) }
			description={ sprintf(
				/* translators: %s: module name */
				__(
					'We were unable to generate your report due to insufficient permissions in %s. To fix this, contact your administrator or get help. Report delivery will automatically resume once the issue is resolved.',
					'google-site-kit'
				),
				module.name
			) }
			onInView={ trackEvents.view }
			ctaButton={
				requestAccessURL
					? {
							label: __( 'Request access', 'google-site-kit' ),
							href: requestAccessURL,
							external: true,
							hideExternalIndicator: true,
							onClick: trackEvents.confirm,
					  }
					: null
			}
			dismissButton={
				getHelpURL
					? {
							label: __( 'Get help', 'google-site-kit' ),
							onClick: trackEvents.dismiss,
							href: getHelpURL,
							external: true,
					  }
					: null
			}
		/>
	);
}
