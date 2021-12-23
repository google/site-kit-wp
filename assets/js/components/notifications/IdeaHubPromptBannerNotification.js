/**
 * IdeaHubPromptBannerNotification component.
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
import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import IdeaHubNotification from '../../../svg/graphics/idea-hub-notification.svg';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { MODULES_IDEA_HUB } from '../../modules/idea-hub/datastore/constants';
import { VIEW_CONTEXT_DASHBOARD } from '../../googlesitekit/constants';
import { trackEvent } from '../../util';
import BannerNotification from './BannerNotification';
const { useSelect, useDispatch } = Data;

const NOTIFICATION_ID = 'idea-hub-module-notification';

export default function IdeaHubPromptBannerNotification() {
	const [ isViewEventTracked, setViewEventTracked ] = useState( false );

	const { dismissItem } = useDispatch( CORE_USER );
	const { activateModule } = useDispatch( CORE_MODULES );
	const { navigateTo } = useDispatch( CORE_LOCATION );
	const { setInternalServerError } = useDispatch( CORE_SITE );

	const isActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'idea-hub' )
	);
	const isItemDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed( NOTIFICATION_ID )
	);
	const adminReauthURL = useSelect( ( select ) =>
		select( MODULES_IDEA_HUB )?.getAdminReauthURL()
	);

	const handleOnDismiss = useCallback( async () => {
		await dismissItem( NOTIFICATION_ID );
		trackEvent(
			`${ VIEW_CONTEXT_DASHBOARD }_module-activation-notification`,
			'dismiss_notification',
			'idea-hub'
		);
	}, [ dismissItem ] );

	const handleOnCTAClick = useCallback(
		async ( event ) => {
			event.preventDefault();
			const { error, response } = await activateModule( 'idea-hub' );
			if ( error ) {
				return setInternalServerError( {
					id: 'idea-hub-setup-error',
					description: error.message,
				} );
			}

			await trackEvent(
				`${ VIEW_CONTEXT_DASHBOARD }_module-activation-notification`,
				'confirm_notification',
				'idea-hub'
			);

			await trackEvent(
				`${ VIEW_CONTEXT_DASHBOARD }_module-activation-notification`,
				'activate_module',
				'idea-hub'
			);

			navigateTo( response.moduleReauthURL );
		},
		[ activateModule, navigateTo, setInternalServerError ]
	);

	const hideIdeaHubModuleNotification =
		isActive ||
		isActive === undefined ||
		isItemDismissed ||
		isItemDismissed === undefined;

	useEffect( () => {
		if ( ! hideIdeaHubModuleNotification && isViewEventTracked === false ) {
			trackEvent(
				`${ VIEW_CONTEXT_DASHBOARD }_module-activation-notification`,
				'view_notification',
				'idea-hub'
			);
			setViewEventTracked( true );
		}
	}, [
		hideIdeaHubModuleNotification,
		isViewEventTracked,
		setViewEventTracked,
	] );

	if ( hideIdeaHubModuleNotification ) {
		return null;
	}

	return (
		<BannerNotification
			id={ NOTIFICATION_ID }
			title={ __(
				'Get new ideas to write about based on what people are searching for',
				'google-site-kit'
			) }
			description={ __(
				'Set up Idea Hub to get topic suggestions based on unanswered searches that match your site’s topics.',
				'google-site-kit'
			) }
			ctaLabel={ __( 'Set up', 'google-site-kit' ) }
			ctaLink={ adminReauthURL }
			SmallImageSVG={ IdeaHubNotification }
			format="small"
			type="win-success"
			dismiss={ __( 'Dismiss', 'google-site-kit' ) }
			onDismiss={ handleOnDismiss }
			onCTAClick={ handleOnCTAClick }
		/>
	);
}
