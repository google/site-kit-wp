/**
 * CompleteModuleActivationCTA component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import { STORE_NAME as CORE_USER, PERMISSION_MANAGE_OPTIONS } from '../googlesitekit/datastore/user/constants';
import { STORE_NAME as MODULES_STORE } from '../googlesitekit/modules/datastore/constants';
const { useSelect } = Data;

const CompleteModuleActivationCTA = ( { slug, title, description } ) => {
	const module = useSelect( ( select ) => select( MODULES_STORE ).getModule( slug ) );
	const adminReauthURL = useSelect( ( select ) => select( `modules/${ slug }` ).getAdminReauthURL() );
	const canManageOptions = useSelect( ( select ) => select( CORE_USER ).hasCapability( PERMISSION_MANAGE_OPTIONS ) );
	const { name } = module;

	const onCTAClick = useCallback( async () => {
		global.location = adminReauthURL;
	} );

	if ( ! canManageOptions ) {
		return null;
	}

	const moduleTitle = title ||
		sprintf(
			/* translators: %s: Module name */
			__( 'Complete %s activation', 'google-site-kit' ),
			name,
		);
	const moduleDescription = description ||
		sprintf(
			/* translators: %s: Module name */
			__( '%s module setup needs to be completed', 'google-site-kit' ),
			name,
		);
	const moduleCTA = __( 'Complete setup', 'google-site-kit' );

	const moduleAriaLabel = sprintf(
		/* translators: %s: Module name */
		__( 'Complete %s setup', 'google-site-kit' ),
		name,
	);

	return (
		<CTA
			title={ moduleTitle }
			description={ moduleDescription }
			onClick={ onCTAClick }
			ctaLabel={ moduleCTA }
			aria-label={ moduleAriaLabel }
		/>
	);
};

CompleteModuleActivationCTA.propTypes = {
	slug: PropTypes.string.isRequired,
};

export default CompleteModuleActivationCTA;
