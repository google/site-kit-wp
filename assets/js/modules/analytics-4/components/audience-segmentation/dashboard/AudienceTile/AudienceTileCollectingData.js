/**
 * AudienceTileCollectingData component.
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
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AudienceTileCollectingDataImage from '../../../../../../../svg/graphics/audience-segmentation-collecting-data.svg';

export default function AudienceTileCollectingData() {
	return (
		<Fragment>
			<AudienceTileCollectingDataImage className="googlesitekit-audience-segmentation-tile__zero-data-image" />
			<p className="googlesitekit-audience-segmentation-tile__zero-data-description">
				{ __(
					'Site Kit is collecting data for this group.',
					'google-site-kit'
				) }
			</p>
		</Fragment>
	);
}
