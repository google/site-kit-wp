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
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { trackEvent } from '../../util';
import UserInputSettings from './UserInputSettings';
import useViewContext from '../../hooks/useViewContext';

const UserInputPromptBannerNotification = () => {
	const viewContext = useViewContext();

	const category = `${ viewContext }_user-input-prompt-notification`;

	const handleOnCTAClick = () => {
		trackEvent( category, 'confirm_notification' );
	};

	const handleOnView = useCallback( () => {
		trackEvent( category, 'view_notification' );
	}, [ category ] );

	const handleOnDismiss = () => {
		trackEvent( category, 'dismiss_notification' );
	};

	return (
		<UserInputSettings
			isDismissible={ true }
			onCTAClick={ handleOnCTAClick }
			onDismiss={ handleOnDismiss }
			onView={ handleOnView }
		/>
	);
};

export default UserInputPromptBannerNotification;
