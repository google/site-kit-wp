/**
 * Ads EnhancedConversionsSettingsNotice component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import {
	createInterpolateElement,
	useCallback,
	useEffect,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { useInView } from '@/js/hooks/useInView';
import useNotificationEvents from '@/js/googlesitekit/notifications/hooks/useNotificationEvents';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { ENHANCED_CONVERSIONS_NOTIFICATION_ADS } from '@/js/modules/ads/components/notifications/EnhancedConversionsNotification';
import LearnMoreLink from '@/js/googlesitekit/notifications/components/common/LearnMoreLink';
import Notice from '@/js/components/Notice';

export default function EnhancedConversionsSettingsNotice( {
	type = Notice.TYPES.INFO,
} ) {
	const id = ENHANCED_CONVERSIONS_NOTIFICATION_ADS;

	const inView = useInView();
	const trackEvents = useNotificationEvents( id );

	const [ isViewedOnce, setIsViewedOnce ] = useState( false );

	const documentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL(
			'enhanced-conversions-ads'
		)
	);
	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed( id )
	);

	const { dismissItem } = useDispatch( CORE_USER );

	const handleCTAClick = useCallback( async () => {
		// Dismiss the notice when the CTA is clicked.
		await dismissItem( id );

		trackEvents.confirm();
	}, [ dismissItem, id, trackEvents ] );

	const handleDismiss = useCallback( async () => {
		await dismissItem( id );

		trackEvents.dismiss();
	}, [ dismissItem, id, trackEvents ] );

	// Track view event when notice comes into view.
	useEffect( () => {
		if ( ! isViewedOnce && inView ) {
			trackEvents.view();

			setIsViewedOnce( true );
		}
	}, [ inView, trackEvents, isViewedOnce ] );

	if ( isDismissed ) {
		return null;
	}

	return (
		<Notice
			type={ type }
			title={ __(
				'Boost your data and Ads results with enhanced conversions',
				'google-site-kit'
			) }
			description={ createInterpolateElement(
				__(
					'Site Kit now supports enhanced conversions. This feature helps your ads count sales and leads more accurately, even across different devices, so your budget is spent smarter. To turn this on, simply agree to the terms of service in your Ads account and enable enhanced conversions. <a />',
					'google-site-kit'
				),
				{
					a: (
						<LearnMoreLink
							id={ id }
							label={ __( 'Learn more', 'google-site-kit' ) }
							url={ documentationURL }
						/>
					),
				}
			) }
			dismissButton={ {
				label: __( 'No thanks', 'google-site-kit' ),
				onClick: handleDismiss,
			} }
			ctaButton={ {
				label: __( 'Go to Ads', 'google-site-kit' ),
				href: 'https://ads.google.com/aw/conversions/customersettings',
				onClick: handleCTAClick,
				external: true,
				hideExternalIndicator: true,
			} }
		/>
	);
}

EnhancedConversionsSettingsNotice.propTypes = {
	type: PropTypes.oneOf( Object.values( Notice.TYPES ) ),
};
