/**
 * CompleteModuleActivationCTA component.
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
import { useCallback } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import CTA from './legacy-notifications/cta';
import Data from 'googlesitekit-data';
import { CORE_USER, PERMISSION_MANAGE_OPTIONS } from '../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import { CORE_LOCATION } from '../googlesitekit/datastore/location/constants';
const { useSelect, useDispatch } = Data;

const CompleteModuleActivationCTA = ( { moduleSlug, title, description } ) => {
	const module = useSelect( ( select ) => select( CORE_MODULES ).getModule( moduleSlug ) );
	const moduleStoreName = useSelect( ( select ) => select( CORE_MODULES ).getModuleStoreName( moduleSlug ) );
	const adminReauthURL = useSelect( ( select ) => select( moduleStoreName )?.getAdminReauthURL() );
	const canManageOptions = useSelect( ( select ) => select( CORE_USER ).hasCapability( PERMISSION_MANAGE_OPTIONS ) );

	const { navigateTo } = useDispatch( CORE_LOCATION );
	const onCTAClick = useCallback( () => navigateTo( adminReauthURL ), [ adminReauthURL, navigateTo ] );

	if ( ! module?.name || ! adminReauthURL || ! canManageOptions ) {
		return null;
	}

	return (
		<CTA
			title={
				title || sprintf(
					/* translators: %s: Module name */
					__( 'Complete %s activation', 'google-site-kit' ),
					module.name,
				)
			}
			description={
				description || sprintf(
					/* translators: %s: Module name */
					__( '%s module setup needs to be completed', 'google-site-kit' ),
					module.name,
				)
			}
			ctaLabel={
				__( 'Complete setup', 'google-site-kit' )
			}
			aria-label={
				sprintf(
					/* translators: %s: Module name */
					__( 'Complete %s setup', 'google-site-kit' ),
					module.name,
				)
			}
			onClick={ onCTAClick }
		/>
	);
};

CompleteModuleActivationCTA.propTypes = {
	moduleSlug: PropTypes.string.isRequired,
	title: PropTypes.string,
	description: PropTypes.string,
};

export default CompleteModuleActivationCTA;
