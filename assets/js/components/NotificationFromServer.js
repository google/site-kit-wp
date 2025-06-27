/**
 * NotificationFromServer component.
 *
 * Component used to render notifications from the server, such as
 * those from `CORE_SITE` or `MODULES_*` data stores.
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
 * WordPress dependencies
 */
import { ReactNode } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Notification } from '../googlesitekit/notifications/components';
import SimpleNotification from '../googlesitekit/notifications/components/layout/SimpleNotification';
import Description from '../googlesitekit/notifications/components/common/Description';
import ActionsCTALinkDismiss from '../googlesitekit/notifications/components/common/ActionsCTALinkDismiss';
import Link from './Link';

/**
 * Renders a notification from the server, usually from a
 * `select( CORE_SITE ).getNotifications()` selector call.
 *
 * @since n.e.x.t
 *
 * @param {Object}    props                Component props.
 * @param {string}    props.id             Notification ID/slug.
 * @param {string}    props.title          Notification title/heading.
 * @param {ReactNode} props.content        Decsription for notification.
 * @param {string}    props.ctaLabel       Label for the call-to-action button.
 * @param {?string}   props.ctaTarget      `target` for the call-to-action link, e.g. `_blank`. Optional.
 * @param {string}    props.ctaURL         URL for the call-to-action link.
 * @param {?boolean}  props.dismissible    Whether the notification is dismissible. Optional.
 * @param {?string}   props.dismissLabel   Label for the dismiss button. Optional.
 * @param {?string}   props.learnMoreLabel Label for the "Learn More" link. Optional.
 * @param {?string}   props.learnMoreURL   URL for the "Learn More" link. Optional.
 * @return {JSX.Element} Notification component.
 */
function NotificationFromServer( {
	id,
	title,
	content,
	ctaLabel,
	ctaTarget,
	ctaURL,
	dismissible,
	dismissLabel,
	learnMoreLabel,
	learnMoreURL,
} ) {
	return (
		<Notification>
			<SimpleNotification
				notificationID={ id }
				title={ title }
				description={
					<Description
						learnMoreLink={
							<Link href={ learnMoreURL } external>
								{ learnMoreLabel }
							</Link>
						}
						text={ content }
					/>
				}
				actions={
					<ActionsCTALinkDismiss
						id={ id }
						ctaLabel={ ctaLabel }
						ctaURL={ ctaURL }
						ctaTarget={ ctaTarget }
						dismissLabel={
							dismissible && dismissLabel
								? dismissLabel
								: undefined
						}
						dismissExpires={ 1 }
						dismissOnCTAClick
					/>
				}
			/>
		</Notification>
	);
}

export default NotificationFromServer;
