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
 * External dependencies
 */
import classnames from 'classnames';
import { useMountedState } from 'react-use';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment, useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { CORE_NOTIFICATIONS } from '../../../googlesitekit/notifications/datastore/constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { DAY_IN_SECONDS } from '../../../util';
import Description from './Description';
import BannerNotification, {
	TYPES,
} from '../../../googlesitekit/notifications/components/layout/BannerNotification';
import AdditionalDescription from './AdditionalDescription';
import PreviewBlock from '../../PreviewBlock';

export default function ModuleRecoveryAlert( { id, Notification } ) {
	const [ selectedModuleSlugs, setSelectedModuleSlugs ] = useState( null );
	const [ inProgress, setInProgress ] = useState( false );
	const isMounted = useMountedState();

	const recoverableModules = useSelect( ( select ) =>
		select( CORE_MODULES ).getRecoverableModules()
	);

	const userRecoverableModuleSlugs = useSelect( ( select ) =>
		select( CORE_MODULES ).getUserRecoverableModuleSlugs()
	);

	const documentationURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL(
			'dashboard-sharing'
		);
	} );

	// The alert renders conditional copy and actions based on:
	// 1. If there is one or more than one module to recover.
	// 2. If the user has access to perform the recovery.
	const hasMultipleRecoverableModules =
		Object.keys( recoverableModules || {} ).length > 1;
	const hasUserRecoverableModules = !! userRecoverableModuleSlugs?.length;

	const { recoverModules, clearRecoveredModules } =
		useDispatch( CORE_MODULES );

	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

	const handleRecoverModules = useCallback( async () => {
		setInProgress( true );

		await clearRecoveredModules();

		const recoveryResponse = await recoverModules( selectedModuleSlugs );

		const successfullyRecoveredModules = Object.keys(
			recoveryResponse?.response?.success || {}
		).filter( ( slug ) => recoveryResponse.response.success[ slug ] );

		// Only dismiss the notification if all modules were recovered successfully.
		if (
			userRecoverableModuleSlugs.length ===
			successfullyRecoveredModules.length
		) {
			dismissNotification( id, { skipHidingFromQueue: false } );
		}

		// Only update state if the component is still mounted.
		if ( isMounted() ) {
			setSelectedModuleSlugs( null );
			setInProgress( false );
		}
	}, [
		id,
		isMounted,
		clearRecoveredModules,
		dismissNotification,
		recoverModules,
		selectedModuleSlugs,
		userRecoverableModuleSlugs,
	] );

	useEffect( () => {
		if (
			selectedModuleSlugs === null &&
			Array.isArray( userRecoverableModuleSlugs )
		) {
			setSelectedModuleSlugs( userRecoverableModuleSlugs );
		}
	}, [ selectedModuleSlugs, userRecoverableModuleSlugs ] );

	// Disable the CTA if no modules are selected to be restored.
	const disableCTA = ! selectedModuleSlugs?.length;

	const isLoading =
		recoverableModules === undefined ||
		userRecoverableModuleSlugs === undefined;

	const hideCTAButton = ! hasUserRecoverableModules;

	if ( inProgress && ! hasUserRecoverableModules ) {
		return null;
	}

	return (
		<Notification>
			<BannerNotification
				notificationID={ id }
				type={ TYPES.ERROR }
				title={ __(
					'Dashboard data for some services has been interrupted',
					'google-site-kit'
				) }
				description={
					isLoading ? (
						<Fragment>
							<PreviewBlock width="auto" height="50px" />
							<PreviewBlock width="auto" height="60px" />
							<PreviewBlock width="220px" height="35px" />
						</Fragment>
					) : (
						<Description
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
				learnMoreLink={
					! isLoading
						? {
								label: __( 'Learn more', 'google-site-kit' ),
								href: documentationURL,
						  }
						: undefined
				}
				additionalDescription={
					! isLoading && (
						<AdditionalDescription
							selectedModuleSlugs={ selectedModuleSlugs }
							hasUserRecoverableModules={
								hasUserRecoverableModules
							}
							hasMultipleRecoverableModules={
								hasMultipleRecoverableModules
							}
							recoverableModules={ recoverableModules }
							userRecoverableModuleSlugs={
								userRecoverableModuleSlugs
							}
							inProgress={ inProgress }
							setSelectedModuleSlugs={ setSelectedModuleSlugs }
						/>
					)
				}
				ctaButton={
					hideCTAButton
						? undefined
						: {
								label: __( 'Recover', 'google-site-kit' ),
								onClick: handleRecoverModules,
								inProgress,
								disabled: disableCTA,
						  }
				}
				dismissButton={
					isLoading
						? undefined
						: {
								label: __(
									'Remind me later',
									'google-site-kit'
								),
								tertiary: ! hideCTAButton,
								className: classnames( {
									'googlesitekit-banner__cta': hideCTAButton,
								} ),
								dismissOptions: hideCTAButton
									? {
											dismissExpires: DAY_IN_SECONDS,
									  }
									: undefined,
						  }
				}
			/>
		</Notification>
	);
}
