/**
 * AdSense Setup Account Site Ready component.
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

/**
 * WordPress dependencies
 */
import { useCallback, useContext, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import ViewContextContext from '../../../../../components/Root/ViewContextContext';
import { trackEvent } from '../../../../../util';
import {
	BACKGROUND_SUBMIT_SUSPENDED,
	MODULES_ADSENSE,
} from '../../../datastore/constants';
import { CORE_UI } from '../../../../../googlesitekit/datastore/ui/constants';
import SetupAccountSiteUI from '../common/SetupAccountSiteUI';
const { useSelect, useDispatch } = Data;

export default function Ready( { site, finishSetup } ) {
	const [ acknowledgedDisabledAutoAds, setAcknowledgedDisabledAutoAds ] =
		useState( false );

	const viewContext = useContext( ViewContextContext );

	const existingTag = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getExistingTag()
	);

	const enableAutoAdsURL = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getServiceAccountSiteAdsPreviewURL()
	);

	const isDoingSubmitChanges = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).isDoingSubmitChanges()
	);

	const { completeSiteSetup, completeAccountSetup } =
		useDispatch( MODULES_ADSENSE );

	const { setValue } = useDispatch( CORE_UI );

	const enableAutoAdsHandler = useCallback(
		( event ) => {
			event.preventDefault();
			trackEvent( `${ viewContext }_adsense`, 'enable_auto_ads' );
			global.open( enableAutoAdsURL, '_blank' );
		},
		[ enableAutoAdsURL, viewContext ]
	);

	const acknowledgeDisabledAutoAdsHandler = useCallback(
		( event ) => {
			event.preventDefault();
			trackEvent( `${ viewContext }_adsense`, 'disable_auto_ads' );
			setAcknowledgedDisabledAutoAds( true );
		},
		[ viewContext ]
	);

	const continueSetupHandler = useCallback( async () => {
		if ( isDoingSubmitChanges ) {
			return;
		}

		// Temporarily suspend ability to perform background submission(s)
		// pending completion of the below async tasks. This prevents a
		// rare race condition from occurring.
		// @see https://github.com/google/site-kit-wp/issues/5614.
		setValue( BACKGROUND_SUBMIT_SUSPENDED, true );

		const successSiteSetupCompletion = await completeSiteSetup();
		const successAccountSetupCompletion = await completeAccountSetup();

		// Re-enable ability to perform background submission(s).
		setValue( BACKGROUND_SUBMIT_SUSPENDED, false );

		if (
			successSiteSetupCompletion &&
			successAccountSetupCompletion &&
			typeof finishSetup === 'function'
		) {
			finishSetup();
		}
	}, [
		isDoingSubmitChanges,
		setValue,
		completeSiteSetup,
		completeAccountSetup,
		finishSetup,
	] );

	const uiProps = {};
	if ( ! site.autoAdsEnabled && ! acknowledgedDisabledAutoAds ) {
		uiProps.heading = __(
			'Enable auto ads for your site',
			'google-site-kit'
		);

		uiProps.description = __(
			'To start serving ads via Site Kit, you need to activate auto ads first. Go to AdSense and enable auto ads for your site.',
			'google-site-kit'
		);

		uiProps.primaryButton = {
			label: __( 'Enable auto ads', 'google-site-kit' ),
			href: enableAutoAdsURL,
			onClick: enableAutoAdsHandler,
		};

		if ( existingTag ) {
			uiProps.description = __(
				'Site Kit recommends enabling auto ads. If your existing AdSense setup relies on individual ad units, you can proceed without enabling auto ads.',
				'google-site-kit'
			);

			uiProps.secondaryButton = {
				label: __(
					'Proceed without enabling auto ads',
					'google-site-kit'
				),
				onClick: acknowledgeDisabledAutoAdsHandler,
			};
		}
	} else {
		uiProps.heading = existingTag
			? __(
					'Your AdSense account is ready to connect to Site Kit',
					'google-site-kit'
			  )
			: __( 'Your site is ready to use AdSense', 'google-site-kit' );

		uiProps.description = existingTag
			? __(
					'Connect your AdSense account to see stats on your overall earnings, page CTR, and top earning pages.',
					'google-site-kit'
			  )
			: __(
					'Site Kit has placed AdSense code on your site to connect your site to AdSense and help you get the most out of ads.',
					'google-site-kit'
			  );

		uiProps.primaryButton = {
			label: __( 'Configure AdSense', 'google-site-kit' ),
			onClick: continueSetupHandler,
		};
	}

	return <SetupAccountSiteUI { ...uiProps } />;
}
