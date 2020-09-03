/**
 * Tag Manager Setup Form Submit Buttons component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Fragment, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../../datastore/constants';
import { STORE_NAME as CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import Button from '../../../../components/button';
import Link from '../../../../components/link';
const { useSelect } = Data;

export default function SetupFormSubmitButtons( { submitForm } ) {
	const canSubmitChanges = useSelect( ( select ) => select( STORE_NAME ).canSubmitChanges() );
	const gtmAnalyticsPropertyID = useSelect( ( select ) => select( STORE_NAME ).getSingleAnalyticsPropertyID() );
	const analyticsModuleActive = useSelect( ( select ) => select( CORE_MODULES ).isModuleActive( 'analytics' ) );

	// Prevent default to avoid form submit error on click:
	// "Form submission canceled because the form is not connected"
	const submitFormWithAnalytics = useCallback( ( event ) => {
		event.preventDefault();
		submitForm( { submitMode: 'with_analytics_setup' } );
	}, [ submitForm ] );
	const submitFormNoAnalytics = useCallback( ( event ) => {
		event.preventDefault();
		submitForm( { submitMode: 'default' } );
	}, [ submitForm ] );

	return (
		<div className="googlesitekit-setup-module__action">
			{ gtmAnalyticsPropertyID && ! analyticsModuleActive && (
				<Fragment>
					<Button
						onClick={ submitFormWithAnalytics }
						disabled={ ! canSubmitChanges }
					>
						{ __( 'Continue to Analytics setup', 'google-site-kit' ) }
					</Button>
					<Link
						className="googlesitekit-setup-module__sub-action"
						onClick={ submitFormNoAnalytics }
						disabled={ ! canSubmitChanges }
						inherit
					>
						{ __( 'Complete setup without Analytics', 'google-site-kit' ) }
					</Link>
				</Fragment>
			) }
			{ ( ! gtmAnalyticsPropertyID || analyticsModuleActive ) && (
				<Button
					onClick={ submitFormNoAnalytics }
					disabled={ ! canSubmitChanges }
				>
					{ __( 'Confirm & Continue', 'google-site-kit' ) }
				</Button>
			) }
		</div>
	);
}

SetupFormSubmitButtons.propTypes = {
	submitForm: PropTypes.func,
};
