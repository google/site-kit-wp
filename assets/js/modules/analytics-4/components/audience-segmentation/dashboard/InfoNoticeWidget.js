/**
 * InfoNoticeWidget component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import whenActive from '../../../../../util/when-active';
import InfoNotice from './InfoNotice';

function InfoNoticeWidget( { Widget } ) {
	return (
		<Widget>
			<InfoNotice
				content={ __(
					'The higher the portion of new visitors you have, the more your audience is growing. Looking at what content brings them to your site may give you insights on how to reach even more people.',
					'google-site-kit'
				) }
				dismissLabel={ __( 'Got it', 'google-site-kit' ) }
				onDismiss={ () => {} }
			/>
		</Widget>
	);
}

InfoNoticeWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};

export default whenActive( { moduleName: 'analytics-4' } )( InfoNoticeWidget );
