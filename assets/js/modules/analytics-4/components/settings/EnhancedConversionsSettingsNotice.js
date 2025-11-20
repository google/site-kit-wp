/**
 * Analytics EnhancedConversionsSettingsNotice component.
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
import { escapeURI } from '@/js/util/escape-uri';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { ENHANCED_CONVERSIONS_NOTIFICATION_ANALYTICS } from '@/js/modules/analytics-4/components/notifications/EnhancedConversionsNotification';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import LearnMoreLink from '@/js/googlesitekit/notifications/components/common/LearnMoreLink';
import Notice from '@/js/components/Notice';

export default function EnhancedConversionsSettingsNotice( {
	type = Notice.TYPES.INFO,
} ) {
	const id = ENHANCED_CONVERSIONS_NOTIFICATION_ANALYTICS;

	const inView = useInView();
	const trackEvents = useNotificationEvents( id );

	const [ isViewedOnce, setIsViewedOnce ] = useState( false );

	const documentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL(
			'enhanced-conversions-analytics'
		)
	);
	const ctaURL = useSelect( ( select ) => {
		const { getAccountID, getPropertyID, getServiceURL } =
			select( MODULES_ANALYTICS_4 );

		const accountID = getAccountID();
		const propertyID = getPropertyID();

		return getServiceURL( {
			path: escapeURI`/a${ accountID }p${ propertyID }/admin/datapolicies/datacollection`,
		} );
	} );
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
				'Boost your Analytics data with enhanced conversions',
				'google-site-kit'
			) }
			description={ createInterpolateElement(
				__(
					'Site Kit now supports enhanced conversions. This free feature helps you get a more complete and reliable count of your sales and leads from your website, even when people switch devices. To activate, turn on the setting for collecting user data in your Analytics account. <a />',
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
				label: __( 'Go to Analytics', 'google-site-kit' ),
				href: ctaURL,
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
