/**
 * EnhancedMeasurementActivationBanner > InProgressBanner component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { CircularProgress } from 'googlesitekit-components';
import SuccessGreenSVG from '../../../../../../svg/graphics/ga4-success-green.svg';
import NotificationWithSmallRightSVG from '../../../../../googlesitekit/notifications/components/layout/NotificationWithSmallRightSVG';
import Description from '../../../../../googlesitekit/notifications/components/common/Description';
import LearnMoreLink from '../../../../../googlesitekit/notifications/components/common/LearnMoreLink';

export default function InProgressBanner( { id, Notification } ) {
	const documentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/analytics/answer/9216061',
		} )
	);

	return (
		<Notification className="googlesitekit-publisher-win googlesitekit-enhanced-measurement-success-banner">
			<NotificationWithSmallRightSVG
				title={ __( 'Setup in progress', 'google-site-kit' ) }
				description={
					<Description
						text={ __(
							'Enhanced measurement is being enabled.',
							'google-site-kit'
						) }
						learnMoreLink={
							<LearnMoreLink
								id={ id }
								label={ __( 'Learn more', 'google-site-kit' ) }
								url={ documentationURL }
							/>
						}
					/>
				}
				actions={ <CircularProgress size={ 20 } /> }
				SVG={ () => <SuccessGreenSVG /> }
			/>
		</Notification>
	);
}
