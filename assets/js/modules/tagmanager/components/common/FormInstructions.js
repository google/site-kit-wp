/**
 * Tag Manager Form Instructions component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { MODULES_TAGMANAGER } from '../../datastore/constants';
const { useSelect } = Data;

export default function FormInstructions( { isSetup } ) {
	const analyticsModuleAvailable = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleAvailable( 'analytics-4' )
	);
	const analyticsModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'analytics-4' )
	);
	const currentGTMGoogleTagID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getCurrentGTMGoogleTagID()
	);

	// If the Analytics module is not active, and the selected container has a valid Google Tag ID,
	// then recommend continuing with Analytics setup.
	if (
		analyticsModuleAvailable &&
		! analyticsModuleActive &&
		currentGTMGoogleTagID
	) {
		return (
			<p>
				{ __(
					'Looks like you may be using Google Analytics within your Google Tag Manager configuration. Activate the Google Analytics module in Site Kit to see relevant insights in your dashboard.',
					'google-site-kit'
				) }
			</p>
		);
	}

	return (
		<p>
			{ isSetup
				? __(
						'Please select your Tag Manager account and container below. You can change these later in your settings.',
						'google-site-kit'
				  )
				: __(
						'Please select your Tag Manager account and container below',
						'google-site-kit'
				  ) }
		</p>
	);
}

FormInstructions.propTypes = {
	isSetup: PropTypes.bool,
};
