/**
 * Thank with Google SetupPublicationActive component.
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
import { Fragment, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_THANK_WITH_GOOGLE } from '../../datastore/constants';
import Button from '../../../../components/Button';
import SetupPublicationScreen from '../common/SetupPublicationScreen';
const { useDispatch } = Data;

export default function SetupPublicationActive( { currentPublicationID } ) {
	const { setPublicationID } = useDispatch( MODULES_THANK_WITH_GOOGLE );

	const handleSetupCustomize = useCallback( () => {
		setPublicationID( currentPublicationID );
	}, [ currentPublicationID, setPublicationID ] );

	return (
		<Fragment>
			<SetupPublicationScreen
				title={ __( 'Congratulations!', 'google-site-kit' ) }
				description={ __(
					'Your account is now active. To get started, customize the appearance of Thank with Google on your site.',
					'google-site-kit'
				) }
			>
				<Button
					onClick={ handleSetupCustomize }
					ariaLabel={ __(
						'Customize Thank with Google',
						'google-site-kit'
					) }
				>
					{ __( 'Customize Thank with Google', 'google-site-kit' ) }
				</Button>
			</SetupPublicationScreen>
		</Fragment>
	);
}

SetupPublicationActive.propTypes = {
	currentPublicationID: PropTypes.string.isRequired,
};
