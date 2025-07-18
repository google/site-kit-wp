/**
 * GoogleTagGatewayWarningNotification component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Link from '../Link';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { useSelect } from 'googlesitekit-data';
import { trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';
import NoticeNotification from '../../googlesitekit/notifications/components/layout/NoticeNotification';
import Notice from '../Notice';

export default function GoogleTagGatewayWarningNotification( {
	id,
	Notification,
} ) {
	const viewContext = useViewContext();

	const serverRequirementsLearnMoreURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL(
			'google-tag-gateway-server-requirements'
		);
	} );

	return (
		<Notification>
			<NoticeNotification
				notificationID={ id }
				type={ Notice.TYPES.WARNING }
				description={ createInterpolateElement(
					__(
						'Google tag gateway for advertisers has been disabled due to server configuration issues. Measurement data is now being routed through the default Google server. Please contact your hosting provider to resolve the issue. <a>Learn more</a>',
						'google-site-kit'
					),
					{
						a: (
							<Link
								href={ serverRequirementsLearnMoreURL }
								onClick={ () => {
									trackEvent(
										`${ viewContext }_warning-notification-gtg`,
										'click_learn_more_link'
									);
								} }
								aria-label={ __(
									'Learn more about Google tag gateway for advertisers server requirements',
									'google-site-kit'
								) }
								external
							/>
						),
					}
				) }
				dismissButton={ {
					label: __( 'Got it', 'google-site-kit' ),
				} }
			/>
		</Notification>
	);
}
