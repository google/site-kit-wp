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
import { useSelect, useDispatch } from 'googlesitekit-data';
import {
	CORE_USER,
	PERMISSION_MANAGE_OPTIONS,
} from '../../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import Link from '../../../../components/Link';
import WarningIcon from '../../../../../svg/icons/warning.svg';
import SettingsNotice, {
	TYPE_WARNING,
} from '../../../../components/SettingsNotice';
import {
	BREAKPOINT_XLARGE,
	useBreakpoint,
} from '../../../../hooks/useBreakpoint';

const ANYONE_CAN_REGISTER_DISABLED_NOTICE =
	'sign-in-with-google-anyone-can-register-notice';

export default function AnyoneCanRegisterDisabledNotice( { className } ) {
	const breakpoint = useBreakpoint();

	const anyoneCanRegister = useSelect( ( select ) =>
		select( CORE_SITE ).getAnyoneCanRegister()
	);
	const canManageOptions = useSelect( ( select ) =>
		select( CORE_USER ).hasCapability( PERMISSION_MANAGE_OPTIONS )
	);
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
	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			ANYONE_CAN_REGISTER_DISABLED_NOTICE
		)
	);

	const notice = createInterpolateElement(
		sprintf(
			/* translators: %1$s: Setting name, %2$s: Sign in with Google service name */
			__(
				'Enable the %1$s setting to allow your visitors to create an account using the %2$s button. <br/>Visit <a>WP settings</a> page to manage this membership setting.',
				'google-site-kit'
			),
			isMultisite
				? __( '"Allow new registrations"', 'google-site-kit' )
				: __( '"Anyone can register"', 'google-site-kit' ),
			_x( 'Sign in with Google', 'Service name', 'google-site-kit' )
		),
		{
			a:
				! canManageOptions && isMultisite ? (
					<span />
				) : (
					<Link key="link" href={ generalSettingsURL } />
				),
			br: breakpoint === BREAKPOINT_XLARGE ? <br /> : <Fragment />,
		}
	);

	const { dismissItem } = useDispatch( CORE_USER );

	if ( isDismissed === true || anyoneCanRegister === true ) {
		return null;
	}

	return (
		<SettingsNotice
			className={ classnames(
				'googlesitekit-anyone-can-register-disabled-notice',
				className
			) }
			type={ TYPE_WARNING }
			dismiss
			dismissCallback={ () => {
				dismissItem( ANYONE_CAN_REGISTER_DISABLED_NOTICE );
			} }
			dismissLabel={ __( 'Got it', 'google-site-kit' ) }
			Icon={ WarningIcon }
			notice={ notice }
		/>
	);
}
