/**
 * StoreErrorNotices component.
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { useFeature } from '@/js/hooks/useFeature';
import { isInsufficientPermissionsError } from '@/js/util/errors';
import { getInsufficientPermissionsErrorDescription } from '@/js/util/insufficient-permissions-error-description';
import ErrorNotice from './ErrorNotice';

export interface StoreErrorNoticesProps {
	hasButton?: boolean;
	moduleSlug?: string;
	storeName: string;
}

const StoreErrorNotices: FC< StoreErrorNoticesProps > = ( {
	hasButton = false,
	moduleSlug,
	storeName,
} ) => {
	const setupFlowRefreshPhase4Enabled = useFeature(
		'setupFlowRefreshPhase4'
	);

	const errors = useSelect(
		( select: Select ): { message?: string }[] =>
			select( storeName ).getErrors(),
		[ storeName ]
	);
	const module = useSelect(
		( select: Select ) => select( CORE_MODULES ).getModule( moduleSlug ),
		[ moduleSlug ]
	);

	const existingErrorMessages: string[] = [];

	return (
		<Fragment>
			{ errors
				.filter( ( error ) => {
					if (
						! error?.message ||
						existingErrorMessages.includes( error.message )
					) {
						return false;
					}

					existingErrorMessages.push( error.message );

					return true;
				} )

				.map( ( error, key ) => {
					const isInsufficientPermissions =
						isInsufficientPermissionsError( error );

					const hasTitle =
						isInsufficientPermissions &&
						setupFlowRefreshPhase4Enabled;

					const message = isInsufficientPermissions
						? getInsufficientPermissionsErrorDescription(
								error.message,
								module
						  )
						: error.message;

					const title = hasTitle
						? __( 'Insufficient permissions', 'google-site-kit' )
						: undefined;

					return (
						<ErrorNotice
							key={ key }
							error={ error }
							hasButton={ hasButton }
							storeName={ storeName }
							message={ message }
							title={ title }
							noPrefix={ hasTitle }
							skipRetryMessage={ hasTitle }
						/>
					);
				} ) }
		</Fragment>
	);
};

export default StoreErrorNotices;
