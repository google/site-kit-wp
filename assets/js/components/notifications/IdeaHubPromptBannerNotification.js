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
import { __, _x } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { MODULES_IDEA_HUB } from '../../modules/idea-hub/datastore/constants';
import { VIEW_CONTEXT_DASHBOARD } from '../../googlesitekit/constants';
import { trackEvent } from '../../util';
import BannerNotification from './BannerNotification';
import IdeaHubPromptSVG from '../../modules/idea-hub/components/common/IdeaHubPromptSVG';
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
			title={ _x( 'Idea Hub', 'Service name', 'google-site-kit' ) }
			description={ __(
				'Idea Hub suggests what you can write about next, from actual questions people asked on Google Search.',
				'google-site-kit'
			) }
			ctaLabel={ __( 'Set up', 'google-site-kit' ) }
			ctaLink={ adminReauthURL }
			format="larger"
			dismiss={ __( 'Dismiss', 'google-site-kit' ) }
			onDismiss={ handleOnDismiss }
			onCTAClick={ handleOnCTAClick }
			badgeLabel={ __( 'Experimental', 'google-site-kit' ) }
			learnMoreLabel={ __( 'Learn more', 'google-site-kit' ) }
			learnMoreURL="https://sitekit.withgoogle.com/documentation/idea-hub-module/"
			WinImageSVG={ IdeaHubPromptSVG }
			noBottomPadding
		/>
	);
}
