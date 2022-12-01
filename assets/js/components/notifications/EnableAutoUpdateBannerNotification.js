/**
 * EnableAutoUpdateBannerNotification component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import React from 'react';
import BannerNotification from './BannerNotification';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { getItem, setItem } from 'googlesitekit-api';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { getTimeInSeconds } from '../../util';
import useQueryArg from '../../hooks/useQueryArg';

const { useSelect } = Data;

const NOTIFICATION_ID = 'enable-plugin-auto-update-notification';
const HIDE_NOTIFICATION_ON_FIRST_SETUP =
	'auto-update-banner-hide-notification-on-first-setup';

const EnableAutoUpdateBannerNotification = () => {
	const hasUpdatePluginCapacity = useSelect( ( select ) =>
		select( CORE_SITE ).getUpdatePluginCapacity()
	);
	const autoUpdatesEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).getAutoUpdatesEnabled()
	);
	const updatePluginNonce = useSelect( ( select ) =>
		select( CORE_SITE ).getUpdatePluginNonce()
	);

	const [ notification ] = useQueryArg( 'notification' );
	const [ slug ] = useQueryArg( 'slug' );

	const [ isInitialPluginSetup, setIsFirstPluginSetup ] = useState( true );

	// set isInitialPluginSetup
	useEffect( () => {
		if ( notification === 'authentication_success' && ! slug ) {
			/**
			 * On initial setup, we want to hide the notification for 10 minutes.
			 */
			setIsFirstPluginSetup( true );
			setItem( HIDE_NOTIFICATION_ON_FIRST_SETUP, true, {
				ttl: getTimeInSeconds() * 10,
			} );
		} else {
			/**
			 * If we are not on initial setup, we want to check if the notification is hidden.
			 */
			getItem( HIDE_NOTIFICATION_ON_FIRST_SETUP ).then(
				( { cacheHit } ) => {
					setIsFirstPluginSetup( cacheHit );
				}
			);
		}
	}, [ notification, slug ] );

	// call api with useCallback
	const enablePluginAutoUpdate = useCallback( async () => {
		const data = new FormData();
		data.append( 'action', 'toggle-auto-updates' );
		data.append( '_ajax_nonce', updatePluginNonce );
		data.append( 'state', 'enable' );
		data.append( 'type', 'plugin' );
		data.append( 'asset', 'google-site-kit/google-site-kit.php' );

		await fetch( global.ajaxurl, {
			method: 'POST',
			credentials: 'same-origin',
			body: data,
		} );
	}, [ updatePluginNonce ] );

	// don't show banner when user has no permission to update plugin or plugin auto updates are disabled
	if ( ! hasUpdatePluginCapacity || ! autoUpdatesEnabled ) {
		return null;
	}

	// dont show on initial plugin setup
	if ( isInitialPluginSetup ) {
		return null;
	}

	return (
		<BannerNotification
			id={ NOTIFICATION_ID }
			title={ __( 'Keep Site Kit up-to-date', 'google-site-kit' ) }
			description={ __(
				'Turn on auto-updates so you always have the latest version of Site Kit. We constantly introduce new features to help you get the insights you need to be successful on the web.',
				'google-site-kit'
			) }
			ctaLabel={ __( 'Enable auto-updates', 'google-site-kit' ) }
			dismiss={ __( 'Dismiss', 'google-site-kit' ) }
			isDismissible={ true }
			dismissExpires={ 0 }
			ctaLink="#"
			onCTAClick={ enablePluginAutoUpdate }
		/>
	);
};

export default EnableAutoUpdateBannerNotification;
