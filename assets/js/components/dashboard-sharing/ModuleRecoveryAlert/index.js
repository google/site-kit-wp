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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import ProgressBar from '../../../googlesitekit/components-gm2/ProgressBar';
import Description from './Description';
import RecoverableActions from './RecoverableActions';
import UnrecoverableActions from './UnrecoverableActions';
import BannerNotification from '@/js/googlesitekit/notifications/components/layout/BannerNotification';
import { TYPES } from '@/js/googlesitekit/notifications/constants';

export default function ModuleRecoveryAlert( { id, Notification } ) {
	const recoverableModules = useSelect( ( select ) =>
		select( CORE_MODULES ).getRecoverableModules()
	);

	const userRecoverableModuleSlugs = useSelect( ( select ) =>
		select( CORE_MODULES ).getUserRecoverableModuleSlugs()
	);

	// The alert renders conditional copy and actions based on:
	// 1. If there is one or more than one module to recover.
	// 2. If the user has access to perform the recovery.
	const hasMultipleRecoverableModules =
		Object.keys( recoverableModules || {} ).length > 1;
	const hasUserRecoverableModules = !! userRecoverableModuleSlugs?.length;

	// TODO: refactor loading state to use Skeleton components within the sub component.
	const isLoading =
		recoverableModules === undefined ||
		userRecoverableModuleSlugs === undefined;

	return (
		<Notification className="googlesitekit-publisher-win">
			<BannerNotification
				notificationID={ id }
				type={ TYPES.ERROR }
				title={ __(
					'Dashboard data for some services has been interrupted',
					'google-site-kit'
				) }
				description={
					isLoading ? (
						<ProgressBar />
					) : (
						<Description
							id={ id }
							recoverableModules={ recoverableModules }
							userRecoverableModuleSlugs={
								userRecoverableModuleSlugs
							}
							hasUserRecoverableModules={
								hasUserRecoverableModules
							}
							hasMultipleRecoverableModules={
								hasMultipleRecoverableModules
							}
						/>
					)
				}
				ctaButton={ {
					label: __( 'Recover', 'google-site-kit' ),
					onClick: () => {
						// Handle recover action
					},
				} }
				actions={
					! isLoading &&
					( hasUserRecoverableModules ? (
						<RecoverableActions
							id={ id }
							recoverableModules={ recoverableModules }
							userRecoverableModuleSlugs={
								userRecoverableModuleSlugs
							}
							hasMultipleRecoverableModules={
								hasMultipleRecoverableModules
							}
						/>
					) : (
						<UnrecoverableActions
							id={ id }
							recoverableModules={ recoverableModules }
							userRecoverableModuleSlugs={
								userRecoverableModuleSlugs
							}
							hasMultipleRecoverableModules={
								hasMultipleRecoverableModules
							}
						/>
					) )
				}
			/>
		</Notification>
	);
}
