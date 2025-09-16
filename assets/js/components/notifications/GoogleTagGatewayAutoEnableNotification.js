/**
 * Google Tag Gateway Auto-Enable Notification component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULE_SLUG_ADS } from '@/js/modules/ads/constants';
import { MODULE_SLUG_TAGMANAGER } from '@/js/modules/tagmanager/constants';
import NoticeNotification from '@/js/googlesitekit/notifications/components/layout/NoticeNotification';
import Notice from '@/js/components/Notice';
import { trackEvent } from '@/js/util';
import useViewContext from '@/js/hooks/useViewContext';

export default function GoogleTagGatewayAutoEnableNotification( {
	id,
	Notification,
} ) {
	const viewContext = useViewContext();

	const { navigateTo } = useDispatch( CORE_LOCATION );

	const isAnalyticsConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( MODULE_SLUG_ANALYTICS_4 )
	);
	const isAdsConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( MODULE_SLUG_ADS )
	);
	const isTagManagerConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( MODULE_SLUG_TAGMANAGER )
	);

	const learnMoreURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL(
			'google-tag-gateway-introduction'
		);
	} );

	// Determine navigation priority: Analytics → Ads → GTM.
	const settingsURL = useSelect( ( select ) => {
		if ( isAnalyticsConnected ) {
			return select( CORE_SITE ).getModuleSettingsEditURL(
				MODULE_SLUG_ANALYTICS_4
			);
		}
		if ( isAdsConnected ) {
			return select( CORE_SITE ).getModuleSettingsEditURL(
				MODULE_SLUG_ADS
			);
		}
		if ( isTagManagerConnected ) {
			return select( CORE_SITE ).getModuleSettingsEditURL(
				MODULE_SLUG_TAGMANAGER
			);
		}
		return null;
	} );

	const handleGotItClick = useCallback( () => {
		trackEvent(
			`${ viewContext }_gtg-auto-enable-notification`,
			'dismiss_notification'
		);
	}, [ viewContext ] );

	const handleEditSettingsClick = useCallback( () => {
		trackEvent(
			`${ viewContext }_gtg-auto-enable-notification`,
			'click_edit_settings'
		);
		if ( settingsURL ) {
			navigateTo( settingsURL );
		}
	}, [ viewContext, settingsURL, navigateTo ] );

	const title = __(
		'An upgrade is coming to your site’s measurement',
		'google-site-kit'
	);

	const description = createInterpolateElement(
		__(
			'Your site will begin routing measurement data (like page views, clicks, and conversions) through your own server. This new Google tag gateway for advertisers feature makes your data more reliable and gives you more control. Starting in October 2025, this feature will gradually be enabled for sites using Analytics, Ads, or Google Tag Manager. If you prefer, you can opt out from Site Kit settings before the change happens. <a>Learn more</a>',
			'google-site-kit'
		),
		{
			a: (
				<a
					href={ learnMoreURL }
					target="_blank"
					rel="noopener noreferrer"
					onClick={ () => {
						trackEvent(
							`${ viewContext }_gtg-auto-enable-notification`,
							'click_learn_more_link'
						);
					} }
				>
					{ __( 'Learn more', 'google-site-kit' ) }
				</a>
			),
		}
	);

	return (
		<Notification>
			<NoticeNotification
				notificationID={ id }
				type={ Notice.TYPES.NEW }
				title={ title }
				description={ description }
				ctaButton={ {
					label: __( 'Got it', 'google-site-kit' ),
					onClick: handleGotItClick,
					dismissOnClick: true,
					dismissOptions: {
						skipHidingFromQueue: true,
					},
				} }
				dismissButton={ {
					label: __( 'Edit settings', 'google-site-kit' ),
					onClick: handleEditSettingsClick,
				} }
			/>
		</Notification>
	);
}
