/**
 * FeatureDiscoveryCallout component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { ElementType, FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { FEATURES_MENU_BUTTON_CLASS } from '@/js/components/FeaturesMenu/constants';
import OverlayNotification from '@/js/googlesitekit/notifications/components/layout/OverlayNotification';
import FeatureDiscoveryCalloutGraphic from '@/svg/graphics/feature-discovery-callout.svg';

export const FEATURE_DISCOVERY_CALLOUT_NOTIFICATION =
	'feature_discovery_callout_notification';

interface FeatureDiscoveryCalloutProps {
	id: string;
	Notification: ElementType;
}

const FeatureDiscoveryCallout: FC< FeatureDiscoveryCalloutProps > = ( {
	id,
	Notification,
} ) => {
	return (
		<Notification>
			<OverlayNotification
				notificationID={ id }
				className="googlesitekit-feature-discovery-callout"
				anchoredOffset={ 28 }
				anchorID={ `.googlesitekit-add-features-button, .${ FEATURES_MENU_BUTTON_CLASS }` }
				title={ __(
					'Unlock more Site Kit features',
					'google-site-kit'
				) }
				description={ __(
					'Discover new ways to earn revenue, understand your visitors, and improve your visibility in Search, all in one place.',
					'google-site-kit'
				) }
				GraphicDesktop={ FeatureDiscoveryCalloutGraphic }
				GraphicMobile={ FeatureDiscoveryCalloutGraphic }
				dismissButton={ {
					label: __( 'Got it', 'google-site-kit' ),
				} }
			/>
		</Notification>
	);
};

export default FeatureDiscoveryCallout;
