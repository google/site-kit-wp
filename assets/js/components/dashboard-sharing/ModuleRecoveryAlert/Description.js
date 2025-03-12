/**
 * ModuleRecoveryAlert Description component.
 *
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
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { default as CommonDescription } from '../../../googlesitekit/notifications/components/common/Description';
import LearnMoreLink from '../../../googlesitekit/notifications/components/common/LearnMoreLink';

export default function Description( {
	id,
	recoverableModules,
	userAccessibleModules,
	hasUserRecoverableModules,
	hasMultipleRecoverableModules,
} ) {
	const documentationURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL(
			'dashboard-sharing'
		);
	} );

	const description = useMemo( () => {
		if ( ! hasMultipleRecoverableModules && hasUserRecoverableModules ) {
			return sprintf(
				/* translators: %s: module name. */
				__(
					'%s data was previously shared with other users on the site by another admin who no longer has access. To restore access, you may recover the module as the new owner.',
					'google-site-kit'
				),
				recoverableModules[ userAccessibleModules[ 0 ] ].name
			);
		}
		if ( hasMultipleRecoverableModules && hasUserRecoverableModules ) {
			return __(
				'The data for the following modules was previously shared with other users on the site by another admin who no longer has access. To restore access, you may recover the module as the new owner.',
				'google-site-kit'
			);
		}
		if (
			! hasMultipleRecoverableModules &&
			! hasUserRecoverableModules &&
			recoverableModules
		) {
			return sprintf(
				/* translators: %s: module name. */
				__(
					'%s data was previously shared with other users on the site by another admin who no longer has access. To restore access, the module must be recovered by another admin who has access.',
					'google-site-kit'
				),
				recoverableModules[
					Object.keys( recoverableModules || {} )[ 0 ]
				]?.name
			);
		}
		if ( hasMultipleRecoverableModules && ! hasUserRecoverableModules ) {
			return __(
				'The data for the following modules was previously shared with other users on the site by another admin who no longer has access. To restore access, the module must be recovered by another admin who has access.',
				'google-site-kit'
			);
		}
	}, [
		hasMultipleRecoverableModules,
		hasUserRecoverableModules,
		recoverableModules,
		userAccessibleModules,
	] );

	return (
		<CommonDescription
			text={ description }
			learnMoreLink={
				<LearnMoreLink
					id={ id }
					label={ __( 'Learn more', 'google-site-kit' ) }
					url={ documentationURL }
				/>
			}
		/>
	);
}
