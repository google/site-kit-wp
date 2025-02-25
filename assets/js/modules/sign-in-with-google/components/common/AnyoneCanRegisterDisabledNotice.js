/**
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createInterpolateElement, Fragment } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import {
	CORE_USER,
	PERMISSION_MANAGE_OPTIONS,
} from '../../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import {
	BREAKPOINT_DESKTOP,
	BREAKPOINT_XLARGE,
	useBreakpoint,
} from '../../../../hooks/useBreakpoint';
import SettingsNotice, {
	TYPE_INFO,
} from '../../../../components/SettingsNotice';
import Link from '../../../../components/Link';
import InfoIcon from '../../../../../svg/icons/info-circle.svg';

const ANYONE_CAN_REGISTER_DISABLED_NOTICE =
	'sign-in-with-google-anyone-can-register-notice';

export default function AnyoneCanRegisterDisabledNotice( { className } ) {
	const breakpoint = useBreakpoint();

	const canManageOptions = useSelect( ( select ) =>
		select( CORE_USER ).hasCapability( PERMISSION_MANAGE_OPTIONS )
	);
	const isMultisite = useSelect( ( select ) =>
		select( CORE_SITE ).isMultisite()
	);
	const generalSettingsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminSettingsURL()
	);

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			ANYONE_CAN_REGISTER_DISABLED_NOTICE
		)
	);

	if ( isDismissed === true ) {
		return null;
	}

	return (
		<SettingsNotice
			className={ classnames(
				'googlesitekit-registration-disabled-notice',
				'googlesitekit-anyone-can-register-disabled-notice',
				className
			) }
			type={ TYPE_INFO }
			Icon={ InfoIcon }
			dismiss={ ANYONE_CAN_REGISTER_DISABLED_NOTICE }
			dismissLabel={ __( 'Got it', 'google-site-kit' ) }
			notice={ createInterpolateElement(
				sprintf(
					/* translators: %1$s: Setting name, %2$s: Sign in with Google service name */
					__(
						'Enable the %1$s setting to allow your visitors to create an account using the %2$s button. <br/>Visit <a>WordPress settings</a> to manage this setting.',
						'google-site-kit'
					),
					isMultisite
						? __( '“Allow new registrations”', 'google-site-kit' )
						: __( '“Anyone can register”', 'google-site-kit' ),
					_x(
						'Sign in with Google',
						'Service name',
						'google-site-kit'
					)
				),
				{
					a:
						! canManageOptions && isMultisite ? (
							<span />
						) : (
							<Link key="link" href={ generalSettingsURL } />
						),
					br:
						breakpoint === BREAKPOINT_XLARGE ||
						breakpoint === BREAKPOINT_DESKTOP ? (
							<br />
						) : (
							<Fragment />
						),
				}
			) }
		/>
	);
}
