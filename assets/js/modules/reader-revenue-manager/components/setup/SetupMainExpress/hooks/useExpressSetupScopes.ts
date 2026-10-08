/**
 * Reader Revenue Manager express setup `useExpressSetupScopes` hook.
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
import { useEffect, useMemo, useRef } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { EXPRESS_SETUP_SCOPES } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/constants';
import { ERROR_CODE_MISSING_REQUIRED_SCOPE } from '@/js/util/errors';

const EMPTY_SCOPES: string[] = [];

/**
 * Requests missing permissions on entry to an express setup flow.
 *
 * @since 1.189.0
 *
 * @param {string[]} [additionalScopes] Scopes required by the specific flow.
 * @return {void}
 */
export default function useExpressSetupScopes(
	additionalScopes: string[] = EMPTY_SCOPES
): void {
	const requestedScopes = useRef( false );
	const { setPermissionScopeError } = useDispatch( CORE_USER );

	const scopes = useMemo(
		() =>
			Array.from(
				new Set( [ ...EXPRESS_SETUP_SCOPES, ...additionalScopes ] )
			),
		[ additionalScopes ]
	);

	const missingScopes = useSelect(
		( select: Select ): string[] | undefined => {
			const grantedScopes = select( CORE_USER ).getGrantedScopes();

			if ( grantedScopes === undefined ) {
				return undefined;
			}

			return scopes.filter(
				( scope ) => ! grantedScopes.includes( scope )
			);
		},
		[ scopes ]
	);

	useEffect( () => {
		if ( requestedScopes.current || ! missingScopes?.length ) {
			return;
		}

		// Request once per mount while navigation to authorization is pending.
		requestedScopes.current = true;

		setPermissionScopeError( {
			code: ERROR_CODE_MISSING_REQUIRED_SCOPE,
			message: __(
				'Additional permissions are required to set up Reader Revenue Manager.',
				'google-site-kit'
			),
			data: {
				status: 403,
				scopes: missingScopes,
				skipModal: true,
				redirectURL: global.location.href,
			},
		} );
	}, [ missingScopes, setPermissionScopeError ] );
}
