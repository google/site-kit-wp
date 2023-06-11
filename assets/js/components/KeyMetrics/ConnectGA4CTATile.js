/**
 * ConnectGA4CTATile component.
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

/**
 * Internal dependencies
 */
import AnalyticsIcon from '../../../svg/graphics/analytics.svg';
import Link from '../../components/Link';

export default function ConnectGA4CTATile() {
	return (
		<div className="googlesitekit-km-connect-ga-cta-tile">
			<div className="googlesitekit-km-connect-ga-cta-tile__icon">
				<AnalyticsIcon width="32" height="32" />
			</div>
			<div className="googlesitekit-km-connect-ga-cta-tile__content">
				<p className="googlesitekit-km-connect-ga-cta-tile__text">
					{ __(
						'Google Analytics is disconnected, some of your metrics can’t be displayed',
						'google-site-kit'
					) }
				</p>
				<Link href="#">
					{ __( 'Connect Google Analytics', 'google-site-kit' ) }
				</Link>
			</div>
		</div>
	);
}
