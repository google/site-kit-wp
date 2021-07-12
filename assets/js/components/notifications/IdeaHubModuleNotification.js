/**
 * IdeaHubModuleNotification component.
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
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { MODULES_IDEA_HUB } from '../../modules/idea-hub/datastore/constants';
import Notification from '../legacy-notifications/notification';
import IdeaHubNotificationSVG from '../../../svg/idea-hub-notification.svg';
const { useSelect, useDispatch } = Data;

const NOTIFICATION_ID = 'idea-hub-module-notification';

const IdeaHubModuleNotification = () => {
	const { dismissItem } = useDispatch( CORE_USER );

	const isActive = useSelect( ( select ) => select( CORE_MODULES ).isModuleActive( 'idea-hub' ) );
	const isItemDismissed = useSelect( ( select ) => select( CORE_USER ).isItemDismissed( NOTIFICATION_ID ) );
	const adminReauthURL = useSelect( ( select ) => select( MODULES_IDEA_HUB )?.getAdminReauthURL() );

	const handleOnDismiss = useCallback( async () => {
		await dismissItem( NOTIFICATION_ID );
	}, [ dismissItem ] );

	if ( isActive || isActive === undefined || isItemDismissed || isItemDismissed === undefined ) {
		return null;
	}

	return (
		<Notification
			id={ NOTIFICATION_ID }
			title={ __( 'Get new ideas to write about based on what people are searching for', 'google-site-kit' ) }
			description={ __( 'Set up Idea Hub to get topic suggestions based on unanswered searches that match your site’s topic.', 'google-site-kit' ) }
			ctaLabel={ __( 'Set up', 'google-site-kit' ) }
			ctaLink={ adminReauthURL }
			SmallImageSVG={ IdeaHubNotificationSVG }
			format="small"
			type="win-success"
			dismiss={ __( 'Dismiss', 'google-site-kit' ) }
			onDismiss={ handleOnDismiss }
		/>
	);
};

export default IdeaHubModuleNotification;
