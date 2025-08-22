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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { ReactNode } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BannerNotification, {
	TYPES,
} from '../googlesitekit/notifications/components/layout/BannerNotification';
import { HOUR_IN_SECONDS } from '../util';

/**
 * Maps props received from the server (e.g. from a `select( CORE_SITE ).getNotifications()`
 * selector call) to the props expected by the new BannerNotification component.
 *
 * @since 1.157.0
 *
 * @param {Object}     props                Component props.
 * @param {string}     props.id             Notification ID/slug.
 * @param {string}     props.title          Notification title/heading.
 * @param {?ReactNode} props.content        Description for notification.
 * @param {string}     props.ctaLabel       Label for the call-to-action button.
 * @param {?string}    props.ctaTarget      `target` for the call-to-action link, e.g. `_blank`. Optional.
 * @param {?string}    props.ctaURL         URL for the call-to-action link.
 * @param {?boolean}   props.dismissible    Whether the notification is dismissible. Optional.
 * @param {?string}    props.dismissLabel   Label for the dismiss button. Optional.
 * @param {?string}    props.learnMoreLabel Label for the "Learn More" link. Optional.
 * @param {?string}    props.learnMoreURL   URL for the "Learn More" link. Optional.
 * @param {?Function}  props.onCTAClick     Callback to run when CTA is clicked. Optional.
 * @param {?Function}  props.onDismissClick Callback to run when the Dismiss button is clicked. Optional.
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
	onCTAClick,
	onDismissClick,
} ) {
	// Notifications from the server should not be dismissed permanently in the database.
	// CoreSiteBannerNotifications are "marked as accepted/dismissed" on the server.
	// AdSense Alerts are not dismissed permanently either, they keep coming back until the
	// issue that raises the alert is resolved. Thus we expire the dismissal after an hour,
	// which was the behaviour prevalent in the legacy BannerNotification component that cached
	// dismissals for an hour in browser storage.
	const dismissOptions = {
		expiresInSeconds: HOUR_IN_SECONDS,
	};

	return (
		<BannerNotification
			notificationID={ id }
			type={ TYPES.WARNING }
			title={ title }
			description={ content }
			learnMoreLink={
				learnMoreURL
					? {
							label: learnMoreLabel,
							href: learnMoreURL,
					  }
					: undefined
			}
			ctaButton={ {
				label: ctaLabel,
				href: ctaURL,
				target: ctaTarget,
				onClick: onCTAClick,
				dismissOptions,
			} }
			dismissButton={
				dismissible
					? {
							label: dismissLabel,
							onClick: onDismissClick,
							dismissOptions,
					  }
					: undefined
			}
		/>
	);
}

NotificationFromServer.propTypes = {
	id: PropTypes.string.isRequired,
	title: PropTypes.string.isRequired,
	content: PropTypes.node,
	ctaLabel: PropTypes.string,
	ctaTarget: PropTypes.string,
	ctaURL: PropTypes.string,
	dismissible: PropTypes.bool,
	dismissLabel: PropTypes.string,
	learnMoreLabel: PropTypes.string,
	learnMoreURL: PropTypes.string,
	onCTAClick: PropTypes.func,
	onDismissClick: PropTypes.func,
};

export default NotificationFromServer;
