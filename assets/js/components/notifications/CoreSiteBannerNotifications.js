/**
 * CoreSiteBannerNotifications component.
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
 * WordPress dependencies
 */
import { useEffect, useState, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_NOTIFICATIONS } from '../../googlesitekit/notifications/datastore/constants';
import { NOTIFICATION_AREAS } from '../../googlesitekit/notifications/constants';
import CoreSiteBannerNotification from './CoreSiteBannerNotification';

const MAX_SECONDS_FOR_SURVEY = 5;

/**
 * Registers notifications from the server, if any exist in the data store.
 *
 * This is a side-effect component that does not render anything directly.
 *
 * @since 1.157.0
 *
 * @return {null} Returns null as this component does not render anything directly.
 */
function CoreSiteBannerNotifications() {
	const [ surveysHaveLoaded, setSurveysHaveLoaded ] = useState( false );
	const [ hasSurveys, setHasSurveys ] = useState( false );

	// This check doesn't rely on an actual date; we only need to track the
	// elapsed number of seconds since this component was rendered to see when
	// to cause a survey to appear after page load.
	const startTime = useRef( Date.now() ); // eslint-disable-line sitekit/no-direct-date

	const surveys = useSelect( ( select ) =>
		select( CORE_SITE ).isUsingProxy() &&
		select( CORE_USER ).areSurveysOnCooldown() === false
			? select( CORE_USER ).getCurrentSurvey()
			: null
	);

	const [ registeredNotifications, setRegisteredNotifications ] = useState(
		[]
	);
	const { registerNotification } = useDispatch( CORE_NOTIFICATIONS );

	const notifications = useSelect( ( select ) =>
		select( CORE_SITE ).getNotifications()
	);

	useEffect( () => {
		const timer = setTimeout( () => {
			if ( ! hasSurveys ) {
				setSurveysHaveLoaded( true );
			}
		}, MAX_SECONDS_FOR_SURVEY * 1000 );

		return () => {
			clearTimeout( timer );
		};
	}, [ hasSurveys ] );

	useEffect( () => {
		const secondsElapsed = Math.floor(
			// See comment above; this is just about tracking elapsed
			// seconds since this component first rendered, so we
			// shouldn't use the reference date.
			( Date.now() - startTime.current ) / 1000 // eslint-disable-line sitekit/no-direct-date
		);
		// Surveys that were received in time prevent the render, surveys loaded
		// after a set amount of time do not prevent notifications from rendering.
		if ( secondsElapsed < MAX_SECONDS_FOR_SURVEY && surveys ) {
			setHasSurveys( true );
		}
	}, [ startTime, surveys, setHasSurveys ] );

	useEffect( () => {
		// If surveys haven't loaded yet or there are surveys on-screen, we don't
		// register any server notifications.
		if ( ! surveysHaveLoaded || hasSurveys ) {
			return;
		}

		// Register any notifications from the server that haven't yet been
		// registered.
		//
		// (Usually there will be one, if any, notification from the server.)
		notifications?.forEach( ( notification ) => {
			if ( registeredNotifications.includes( notification.id ) ) {
				return;
			}

			registerNotification( notification.id, {
				Component( { Notification } ) {
					return (
						<Notification>
							<CoreSiteBannerNotification { ...notification } />
						</Notification>
					);
				},
				priority: notification.priority,
				areaSlug: NOTIFICATION_AREAS.HEADER,
				isDismissible: notification.dismissible,
			} );

			setRegisteredNotifications( ( previousRegisteredNotifications ) => {
				previousRegisteredNotifications.push( notification.id );

				return previousRegisteredNotifications;
			} );
		} );
	}, [
		hasSurveys,
		notifications,
		registerNotification,
		registeredNotifications,
		surveysHaveLoaded,
	] );

	return null;
}

export default CoreSiteBannerNotifications;
