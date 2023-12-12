/**
 * EnhancedMeasurementActivationBanner > InProgressBanner component.
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
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import BannerNotification from '../../../../../components/notifications/BannerNotification';
import SuccessGreenSVG from '../../../../../../svg/graphics/ga4-success-green.svg';
import { CircularProgress as MuiCircularProgress } from '@material-ui/core';
import useViewContext from '../../../../../hooks/useViewContext';
import { trackEvent } from '../../../../../util';
const { useSelect } = Data;

export default function InProgressBanner() {
	const viewContext = useViewContext();

	const documentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/analytics/answer/9216061',
		} )
	);

	useEffect( () => {
		trackEvent(
			`${ viewContext }_enhanced-measurement-setup-in-progress`,
			'view_notification'
		);
	}, [ viewContext ] );

	return (
		<BannerNotification
			id="googlesitekit-enhanced-measurement-activation-banner"
			className="googlesitekit-enhanced-measurement-setup-in-progress-banner"
			title={ __( 'Setup is in progress', 'google-site-kit' ) }
			description={ __(
				'Enhanced measurement is being enabled.',
				'google-site-kit'
			) }
			isDismissible={ false }
			ctaComponent={ <MuiCircularProgress size={ 24 } /> }
			WinImageSVG={ () => <SuccessGreenSVG /> }
			format="small"
			type="win-success"
			learnMoreLabel={ __( 'Learn more', 'google-site-kit' ) }
			learnMoreURL={ documentationURL }
		/>
	);
}
