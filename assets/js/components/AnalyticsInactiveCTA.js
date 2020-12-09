/**
 * AnalyticsInactiveCTA component.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	showErrorNotification,
} from '../util';
import Data from 'googlesitekit-data';
import CTA from './legacy-notifications/cta';
import GenericError from './legacy-notifications/generic-error';
import { STORE_NAME as CORE_USER, PERMISSION_MANAGE_OPTIONS } from '../googlesitekit/datastore/user/constants';
import { STORE_NAME as CORE_MODULES } from '../googlesitekit/modules/datastore/constants';

const { useSelect, useDispatch } = Data;

function AnalyticsInactiveCTA( props ) {
	const {
		title = __( 'Learn more about what visitors do on your site.', 'google-site-kit' ),
		description = __( 'Connect with Google Analytics to see unique visitors, goal completions, top pages and more.', 'google-site-kit' ),
		ctaLabel = __( 'Set up Analytics', 'google-site-kit' ),
	} = props;
	const { activateModule } = useDispatch( CORE_MODULES );

	const onSetupAnalytics = useCallback( async () => {
		const { error, response } = await activateModule( 'analytics' );

		if ( ! error ) {
			global.location.assign( response.moduleReauthURL );
		} else {
			showErrorNotification( GenericError, {
				id: 'analytics-setup-error',
				title: __( 'Internal Server Error', 'google-site-kit' ),
				description: error.message,
				format: 'small',
				type: 'win-error',
			} );
		}
	} );

	const canManageOptions = useSelect( ( select ) => select( CORE_USER ).hasCapability( PERMISSION_MANAGE_OPTIONS ) );

	if ( ! canManageOptions ) {
		return null;
	}

	return (
		<CTA
			title={ title }
			description={ description }
			onClick={ onSetupAnalytics }
			ctaLabel={ ctaLabel }
		/>
	);
}

AnalyticsInactiveCTA.propTypes = {
	title: PropTypes.string,
	description: PropTypes.string,
	ctaLabel: PropTypes.string,
};

export default AnalyticsInactiveCTA;
