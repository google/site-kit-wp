/**
 * Ads Disconnection Note component.
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
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import Link from '@/js/components/Link';
import { MODULE_SLUG_ADS } from '@/js/modules/ads/constants';

export default function SettingsDisconnectNote() {
	const detailsLinkURL = useSelect( ( select ) =>
		select( CORE_MODULES ).getDetailsLinkURL( MODULE_SLUG_ADS )
	);

	if ( ! detailsLinkURL ) {
		return null;
	}

	return createInterpolateElement(
		__(
			'<strong>Note:</strong> Disconnecting Ads from Site Kit won’t remove your campaign from Ads. <br />Visit <DetailsLink /> to manage your campaign settings',
			'google-site-kit'
		),
		{
			strong: <strong />,
			br: <br />,
			DetailsLink: (
				<Link href={ detailsLinkURL } external hideExternalIndicator>
					{ __( 'Ads', 'google-site-kit' ) }
				</Link>
			),
		}
	);
}
