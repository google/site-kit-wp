/**
 * Sign in with Google CompatibilityChecks component.
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
 * External dependencies
 */
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ProgressBar } from 'googlesitekit-components';
import { useSelect } from 'googlesitekit-data';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import Description from '@/js/components/Notice/Description';
import CompatibilityErrors from '@/js/modules/sign-in-with-google/components/common/CompatibilityErrors';
import { SignInWithGoogleCompatibilityErrors } from '@/js/modules/sign-in-with-google/components/types';
import { MODULES_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/datastore/constants';

const CompatibilityChecks: FC = () => {
	const compatibilityChecks = useSelect( ( select ) => {
		// @ts-expect-error Data store is not yet typed.
		return select( MODULES_SIGN_IN_WITH_GOOGLE ).getCompatibilityChecks();
	}, [] );
	const isFetchingGetCompatibilityChecks = useSelect( ( select ) => {
		return select(
			MODULES_SIGN_IN_WITH_GOOGLE
			// @ts-expect-error Data store is not yet typed.
		).isFetchingGetCompatibilityChecks();
	}, [] );
	const errors: SignInWithGoogleCompatibilityErrors =
		compatibilityChecks?.checks || {};
	const hasErrors = Object.keys( errors ).length > 0;

	if (
		compatibilityChecks === undefined ||
		isFetchingGetCompatibilityChecks
	) {
		return (
			<div className="googlesitekit-margin-bottom-1rem">
				<small>
					{ __( 'Checking Compatibility…', 'google-site-kit' ) }
				</small>
				<ProgressBar small compress />
			</div>
		);
	}

	if ( hasErrors ) {
		return (
			<Notice
				className="googlesitekit-sign-in-with-google-compatibility-notice"
				type={ NOTICE_TYPES.WARNING }
				title={ __(
					'Your site may not be ready for Sign in with Google',
					'google-site-kit'
				) }
			>
				<Description as="div">
					<CompatibilityErrors errors={ errors } />
				</Description>
			</Notice>
		);
	}

	return null;
};

export default CompatibilityChecks;
