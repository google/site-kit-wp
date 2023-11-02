/**
 * EnhancedMeasurementActivationBanner > SuccessBanner component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { useCallback, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { ENHANCED_MEASUREMENT_ACTIVATION_BANNER_DISMISSED_ITEM_KEY } from '../../../constants';
import BannerNotification from '../../../../../components/notifications/BannerNotification';
import SuccessGreenSVG from '../../../../../../svg/graphics/ga4-success-green.svg';
import useViewContext from '../../../../../hooks/useViewContext';
import { trackEvent } from '../../../../../util';
const { useDispatch, useSelect } = Data;

export default function SuccessBanner() {
	const viewContext = useViewContext();

	const documentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/analytics/answer/9216061',
		} )
	);

	const { dismissItem } = useDispatch( CORE_USER );

	const handleDismiss = useCallback( () => {
		dismissItem(
			ENHANCED_MEASUREMENT_ACTIVATION_BANNER_DISMISSED_ITEM_KEY
		);

		trackEvent(
			`${ viewContext }_enhanced-measurement-success`,
			'confirm_notification'
		);
	}, [ viewContext, dismissItem ] );

	useEffect( () => {
		trackEvent(
			`${ viewContext }_enhanced-measurement-success`,
			'view_notification'
		);
	}, [ viewContext ] );

	return (
		<BannerNotification
			id="googlesitekit-enhanced-measurement-activation-banner"
			className="googlesitekit-enhanced-measurement-success-banner"
			title={ __(
				'You successfully enabled enhanced measurement for your site',
				'google-site-kit'
			) }
			description={ __(
				'Your configured Analytics web data stream will now automatically measure interactions on your site in addition to standard page views measurement.',
				'google-site-kit'
			) }
			dismiss={ __( 'OK, Got it', 'google-site-kit' ) }
			onDismiss={ handleDismiss }
			WinImageSVG={ () => <SuccessGreenSVG /> }
			format="small"
			type="win-success"
			learnMoreLabel={ __( 'Learn more', 'google-site-kit' ) }
			learnMoreURL={ documentationURL }
		/>
	);
}
