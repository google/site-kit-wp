/**
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
 * External dependencies
 */
import classnames from 'classnames';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { Button } from 'googlesitekit-components';
import SettingsNotice, {
	TYPE_WARNING,
} from '../../../../components/SettingsNotice';
import ExternalIcon from '../../../../../svg/icons/external.svg';
import InfoIcon from '../../../../../svg/icons/info-circle.svg';

export default function RegistrationDisabledNotice( { className } ) {
	const isMultisite = useSelect( ( select ) =>
		select( CORE_SITE ).isMultisite()
	);

	const generalSettingsURL = useSelect(
		( select ) =>
			new URL(
				isMultisite ? 'network/settings.php' : 'options-general.php',
				select( CORE_SITE ).getAdminURL()
			).href
	);

	return (
		<SettingsNotice
			className={ classnames(
				'googlesitekit-registration-disabled-notice googlesitekit-registration-disabled-notice--with-outer-cta',
				className
			) }
			Icon={ InfoIcon }
			type={ TYPE_WARNING }
			notice={ sprintf(
				/* translators: %1$s: Setting name, %2$s: Sign in with Google service name */
				__(
					'Using "One Tap sign in on all pages" will cause errors for users without an account. Enable %1$s. Visit WordPress settings to allow anyone to use %2$s.',
					'google-site-kit'
				),
				isMultisite
					? __( '“Allow new registrations”', 'google-site-kit' )
					: __( '“Anyone can register”', 'google-site-kit' ),
				_x( 'Sign in with Google', 'Service name', 'google-site-kit' )
			) }
			OuterCTA={ () => (
				<Button
					href={ generalSettingsURL }
					target="_blank"
					trailingIcon={ <ExternalIcon width={ 13 } height={ 13 } /> }
				>
					{ __( 'Manage settings', 'google-site-kit' ) }
				</Button>
			) }
		/>
	);
}

RegistrationDisabledNotice.propTypes = {
	className: PropTypes.string,
};
