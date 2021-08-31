/**
 * DashboardModulesAlerts component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { each } from 'lodash';
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { Fragment, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import NotificationAlertSVG from '../../../svg/notification-alert.svg';
import Notification from './notification';
import { modulesNotificationsToRequest, getModulesNotifications } from './util';
const { useSelect } = Data;

function DashboardModulesAlerts() {
	const [ alerts, setAlerts ] = useState( {} );

	const modules = useSelect( ( select ) =>
		select( CORE_MODULES ).getModules()
	);

	useMount( async () => {
		const modulesWithNotifications = modulesNotificationsToRequest();

		if ( modulesWithNotifications ) {
			const response = await getModulesNotifications();

			setAlerts( response.results );
		}
	} );

	if ( 0 === Object.keys( alerts ).length || modules === undefined ) {
		return null;
	}

	const notifications = [];

	Object.keys( alerts ).forEach( ( key ) => {
		each( alerts[ key ], ( notification ) => {
			notifications.push(
				<Notification
					key={ notification.id }
					id={ notification.id }
					title={ notification.title || '' }
					description={ notification.description || '' }
					blockData={ notification.blockData || [] }
					WinImageSVG={ () => <NotificationAlertSVG height="136" /> }
					format={ notification.format || 'small' }
					learnMoreURL={ notification.learnMoreURL || '' }
					learnMoreDescription={
						notification.learnMoreDescription || ''
					}
					learnMoreLabel={ notification.learnMoreLabel || '' }
					ctaLink={ notification.ctaURL || '' }
					ctaLabel={ notification.ctaLabel || '' }
					ctaTarget={ notification.ctaTarget || '' }
					type={ notification.severity || '' }
					dismiss={
						notification.dismiss ||
						__( 'OK, Got it!', 'google-site-kit' )
					}
					isDismissable={ notification.isDismissable || true }
					logo={ notification.logo || true }
					module={ key }
					moduleName={ modules[ key ].name }
					pageIndex={ notification.pageIndex || '' }
					dismissExpires={ notification.dismissExpires || 0 }
					showOnce={ notification.showOnce || false }
				/>
			);
		} );
	} );

	return <Fragment>{ notifications }</Fragment>;
}

export default DashboardModulesAlerts;
