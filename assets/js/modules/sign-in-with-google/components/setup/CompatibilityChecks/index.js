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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { ProgressBar } from 'googlesitekit-components';
import { MODULES_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/datastore/constants';
import CompatibilityErrorNotice from './CompatibilityErrorNotice';

export default function CompatibilityChecks() {
	const compatibilityChecks = useSelect( ( select ) =>
		select( MODULES_SIGN_IN_WITH_GOOGLE ).getCompatibilityChecks()
	);
	const isFetchingGetCompatibilityChecks = useSelect( ( select ) =>
		select( MODULES_SIGN_IN_WITH_GOOGLE ).isFetchingGetCompatibilityChecks()
	);
	const errors = compatibilityChecks?.checks || {};
	const hasErrors = Object.keys( errors ).length > 0;

	if ( isFetchingGetCompatibilityChecks ) {
		return (
			<div className="googlesitekit-margin-bottom-1rem${ additionalClassName">
				<small>
					{ __( 'Checking Compatibility…', 'google-site-kit' ) }
				</small>
				<ProgressBar small compress />
			</div>
		);
	}

	if ( hasErrors ) {
		return <CompatibilityErrorNotice errors={ errors } />;
	}

	return null;
}
