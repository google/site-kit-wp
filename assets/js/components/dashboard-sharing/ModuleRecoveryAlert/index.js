/**
 * ModuleRecoveryAlert component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import SimpleNotification from '../../../googlesitekit/notifications/components/layout/SimpleNotification';
import Description from './Description';
import Actions from './Actions';

export default function ModuleRecoveryAlert( { id, Notification } ) {
	const recoverableModules = useSelect( ( select ) =>
		select( CORE_MODULES ).getRecoverableModules()
	);

	const userAccessibleModules = useSelect( ( select ) => {
		const modules = select( CORE_MODULES ).getRecoverableModules();

		if ( modules === undefined ) {
			return undefined;
		}

		const accessibleModules = Object.keys( modules ).map( ( slug ) => ( {
			slug,
			hasModuleAccess: select( CORE_MODULES ).hasModuleAccess( slug ),
		} ) );

		if (
			accessibleModules.some(
				( { hasModuleAccess } ) => hasModuleAccess === undefined
			)
		) {
			return undefined;
		}

		return accessibleModules
			.filter( ( { hasModuleAccess } ) => hasModuleAccess )
			.map( ( { slug } ) => slug );
	} );

	// The alert renders conditional copy and actions based on:
	// 1. If there is one or more than one module to recover.
	// 2. If the user has access to perform the recovery.
	const hasMultipleRecoverableModules = useMemo(
		() => Object.keys( recoverableModules || {} ).length > 1,
		[ recoverableModules ]
	);
	const hasUserRecoverableModules = useMemo(
		() => !! Object.keys( userAccessibleModules || {} ).length,
		[ userAccessibleModules ]
	);

	return (
		<Notification className="googlesitekit-publisher-win">
			<SimpleNotification
				title={ __(
					'Dashboard data for some services has been interrupted',
					'google-site-kit'
				) }
				description={
					<Description
						id={ id }
						recoverableModules={ recoverableModules }
						userAccessibleModules={ userAccessibleModules }
						hasUserRecoverableModules={ hasUserRecoverableModules }
						hasMultipleRecoverableModules={
							hasMultipleRecoverableModules
						}
					/>
				}
				actions={
					<Actions
						id={ id }
						recoverableModules={ recoverableModules }
						userAccessibleModules={ userAccessibleModules }
						hasUserRecoverableModules={ hasUserRecoverableModules }
						hasMultipleRecoverableModules={
							hasMultipleRecoverableModules
						}
					/>
				}
			/>
		</Notification>
	);
}
