/**
 * Cancel User Input Button Component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { Button } from 'googlesitekit-components';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
const { useSelect, useDispatch } = Data;

export default function CancelUserInputButton( { disabled } ) {
	const dashboardURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' )
	);

	const { navigateTo } = useDispatch( CORE_LOCATION );

	return (
		<Button
			tertiary
			className="googlesitekit-user-input__buttons--cancel"
			onClick={ () => navigateTo( dashboardURL ) }
			disabled={ disabled }
		>
			{ __( 'Cancel', 'google-site-kit' ) }
		</Button>
	);
}

CancelUserInputButton.propTypes = {
	disabled: PropTypes.bool,
};
