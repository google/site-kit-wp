/**
 * ReportErrorNotice component.
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
import { TYPES } from '@/js/components/Notice/constants';
import useNotificationEvents from '@/js/googlesitekit/notifications/hooks/useNotificationEvents';
import withIntersectionObserver from '@/js/util/withIntersectionObserver';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';

export const EMAIL_REPORTS_REPORT_ERROR_NOTICE =
	'email_reports_report_error_notice';

const NoticeWithIntersectionObserver = withIntersectionObserver( Notice );

export default function ReportErrorNotice( { moduleSlug, onGoToSettings } ) {
	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( moduleSlug )
	);

	const trackEvents = useNotificationEvents(
		EMAIL_REPORTS_REPORT_ERROR_NOTICE
	);

	const settingsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getModuleSettingsURL( moduleSlug )
	);

	const getHelpURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'email-reporting' )
	);

	return (
		<NoticeWithIntersectionObserver
			className="googlesitekit-email-reporting__admin-settings-notice"
			type={ TYPES.ERROR }
			title={ __(
				'Email reports are failing to send',
				'google-site-kit'
			) }
			description={ sprintf(
				/* translators: %1$s: module name */
				__(
					'We were unable to generate your report because data loading failed for %1$s. To fix this, go to %1$s settings in Site Kit or get help. Report delivery will automatically resume once the issue is resolved.',
					'google-site-kit'
				),
				module.name
			) }
			onInView={ trackEvents.view }
			ctaButton={
				settingsURL
					? {
							label: __( 'Go to settings', 'google-site-kit' ),
							href: settingsURL,
							onClick: () => {
								onGoToSettings?.();
								trackEvents.confirm();
							},
					  }
					: null
			}
			dismissButton={ {
				label: __( 'Get help', 'google-site-kit' ),
				onClick: trackEvents.dismiss,
				href: getHelpURL,
				external: true,
			} }
		/>
	);
}
