/**
 * DefaultSettingsStatus component for SettingsActiveModule.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect, type Select } from '@/js/googlesitekit/data';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { SIZE_MEDIUM } from '@/js/components/Typography/constants';
import { Button } from '@/js/googlesitekit-components';
import P from '@/js/components/Typography/P';
// @ts-expect-error - We need to add types for imported SVGs.
import ConnectedIcon from '@/svg/icons/connected.svg';
// @ts-expect-error - We need to add types for imported SVGs.
import WarningIcon from '@/svg/icons/warning-v2.svg';

export default function DefaultSettingsStatus( { slug }: { slug: string } ) {
	const module = useSelect( ( select: Select ) =>
		select( CORE_MODULES ).getModule( slug )
	);

	const adminReauthURL = useSelect( ( select: Select ) => {
		const storeName = select( CORE_MODULES ).getModuleStoreName( slug );
		return select( storeName )?.getAdminReauthURL?.();
	} );

	const requirementsError = useSelect( ( select: Select ) =>
		select( CORE_MODULES )?.getCheckRequirementsError( slug )
	);

	const isNavigatingToAdminReAuthURL = useSelect(
		( select: Select ) =>
			adminReauthURL &&
			select( CORE_LOCATION ).isNavigatingTo( adminReauthURL )
	);

	const { navigateTo } = useDispatch( CORE_LOCATION );

	const onActionClick = useCallback(
		( event ) => {
			event.stopPropagation();
			navigateTo( adminReauthURL );
		},
		[ navigateTo, adminReauthURL ]
	);

	if ( ! module ) {
		return null;
	}

	const { name, connected } = module;

	return (
		<div
			className={ classnames( 'googlesitekit-settings-module__status', {
				'googlesitekit-settings-module__status--connected': connected,
				'googlesitekit-settings-module__status--not-connected':
					! connected,
			} ) }
		>
			{ connected ? (
				<P size={ SIZE_MEDIUM }>
					{ __( 'Connected', 'google-site-kit' ) }
				</P>
			) : (
				// @ts-expect-error - The `Button` component is not typed yet.
				<Button
					onClick={ onActionClick }
					disabled={
						!! requirementsError || isNavigatingToAdminReAuthURL
					}
					inverse
				>
					{ sprintf(
						/* translators: %s: module name. */
						__( 'Complete setup for %s', 'google-site-kit' ),
						name
					) }
				</Button>
			) }
			<span
				className={ classnames(
					'googlesitekit-settings-module__status-icon',
					{
						'googlesitekit-settings-module__status-icon--connected':
							connected,
						'googlesitekit-settings-module__status-icon--not-connected':
							! connected,
					}
				) }
			>
				{ connected ? (
					<ConnectedIcon width={ 10 } height={ 8 } />
				) : (
					<WarningIcon width={ 19 } height={ 17 } />
				) }
			</span>
		</div>
	);
}
