/**
 * DashboardCoreSiteAlerts component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import Notification from 'GoogleComponents/notifications/notification';

/**
 * Internal dependencies
 */
import {
	getNotifications,
	acceptNotification,
	dismissNotification,
} from './site';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

class DashboardCoreSiteAlerts extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			notifications: false,
		};
	}

	async componentDidMount() {
		const notifications = await getNotifications().catch( ( e ) => {
			// eslint-disable-next-line no-console
			console.warn( 'Error caught while fetching notifications', JSON.stringify( e ) );
		} );

		this.setState( { notifications } );
	}

	render() {
		const { notifications } = this.state;

		if ( ! Array.isArray( notifications ) ) {
			return null;
		}

		return notifications.map(
			( notification ) => <Notification
				key={ notification.slug }
				id={ notification.slug }
				title={ notification.title || '' }
				description={ notification.content || '' }
				learnMoreURL={ notification.learnMoreURL || '' }
				learnMoreLabel={ notification.learnMoreLabel || '' }
				ctaLink={ notification.ctaURL || '' }
				ctaLabel={ notification.ctaLabel || '' }
				ctaTarget={ notification.ctaTarget || '' }
				dismiss={ notification.dismissLabel || __( 'OK, Got it!', 'google-site-kit' ) }
				isDismissable={ notification.dismissible }
				onCTAClick={ async () => {
					await acceptNotification( notification.slug );
				} }
				onDismiss={ async () => {
					await dismissNotification( notification.slug );
				} }
			/>
		);
	}
}

export default DashboardCoreSiteAlerts;
