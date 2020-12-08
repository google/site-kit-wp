/**
 * ActivateModule component.
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
import {
	showErrorNotification,
} from '../util';
import CTA from './legacy-notifications/cta';
import Data from 'googlesitekit-data';
import GenericError from './legacy-notifications/generic-error';
import { STORE_NAME as CORE_USER, PERMISSION_MANAGE_OPTIONS } from '../googlesitekit/datastore/user/constants';
import { STORE_NAME as CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
const { useSelect, useDispatch } = Data;

const ActivateModuleCTA = ( { slug, title, description } ) => {
	const module = useSelect( ( select ) => select( CORE_MODULES ).getModule( slug ) );
	const canManageOptions = useSelect( ( select ) => select( CORE_USER ).hasCapability( PERMISSION_MANAGE_OPTIONS ) );
	const { activateModule } = useDispatch( CORE_MODULES );
	const onCTAClick = useCallback( async () => {
		const { error, response } = await activateModule( slug );

		if ( ! error ) {
			global.location.assign( response.moduleReauthURL );
		} else {
			showErrorNotification( GenericError, {
				id: `${ slug }-setup-error`,
				title: __( 'Internal Server Error', 'google-site-kit' ),
				description: error.message,
				format: 'small',
				type: 'win-error',
			} );
		}
	} );

	if ( ! module || ! canManageOptions ) {
		return null;
	}
	const { name } = module;

	const moduleTitle = title ||
		sprintf(
			/* translators: %s: Module name */
			__( 'Activate %s', 'google-site-kit' ),
			name,
		);
	const moduleDescription = description ||
		sprintf(
			/* translators: %s: Module name */
			__( '%s module needs to be configured', 'google-site-kit' ),
			name,
		);
	const moduleCTALabel = sprintf(
		/* translators: %s: Module name */
		__( 'Set up %s', 'google-site-kit' ),
		name,
	);

	return (
		<CTA
			title={ moduleTitle }
			description={ moduleDescription }
			onClick={ onCTAClick }
			ctaLabel={ moduleCTALabel }
		/>
	);
};

ActivateModuleCTA.propTypes = {
	slug: PropTypes.string.isRequired,
};

export default ActivateModuleCTA;
