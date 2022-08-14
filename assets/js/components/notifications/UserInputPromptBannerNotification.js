/**
 * UserInputPromptBannerNotification component.
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
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { trackEvent } from '../../util';
import UserInputSettings from './UserInputSettings';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import useViewContext from '../../hooks/useViewContext';

const { useSelect } = Data;

const UserInputPromptBannerNotification = () => {
	const viewContext = useViewContext();

	const userInputState = useSelect( ( select ) =>
		select( CORE_USER ).getUserInputState()
	);

	const category = `${ viewContext }_user-input-prompt-notification`;

	const [ viewNotificationEventFired, setViewNotificationEventFired ] =
		useState( false );

	useEffect( () => {
		if (
			! viewNotificationEventFired &&
			userInputState !== undefined &&
			userInputState !== 'completed'
		) {
			trackEvent( category, 'view_notification' ).finally( () =>
				setViewNotificationEventFired( true )
			);
		}
	}, [ category, userInputState, viewNotificationEventFired ] );

	const handleOnCTAClick = () => {
		trackEvent( category, 'confirm_notification' );
	};

	const handleOnDismiss = () => {
		trackEvent( category, 'dismiss_notification' );
	};

	return (
		<UserInputSettings
			isDismissible={ true }
			onCTAClick={ handleOnCTAClick }
			onDismiss={ handleOnDismiss }
		/>
	);
};

export default UserInputPromptBannerNotification;
