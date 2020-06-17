/**
 * Optimize Setup form.
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
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Button from '../../../components/button';
import Link from '../../../components/link';
import { STORE_NAME, FORM_SETUP } from '../datastore/constants';
import { STORE_NAME as CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import {
	ErrorNotice,
} from '../common/';
import { trackEvent } from '../../../util';
const { useSelect, useDispatch } = Data;

export default function SetupForm( { finishSetup } ) {
	const canSubmitChanges = useSelect( ( select ) => select( STORE_NAME ).canSubmitChanges() );
	const hasEditScope = useSelect( ( select ) => select( STORE_NAME ).hasEditScope() );
	const autoSubmit = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_SETUP, 'autoSubmit' ) );

	const { setValues } = useDispatch( CORE_FORMS );
	const { submitChanges } = useDispatch( STORE_NAME );
	const submitForm = useCallback( async ( event ) => {
		event.preventDefault();
		const { error } = await submitChanges();
		if ( ! error ) {
			setValues( FORM_SETUP, { autoSubmit: false } );
			await trackEvent( 'optimize_setup', 'optimize_configured' );
			finishSetup();
		}
	}, [ canSubmitChanges, finishSetup ] );

	// If the user lands back on this component with autoSubmit and the edit scope,
	// resubmit the form.
	useEffect( () => {
		if ( autoSubmit && hasEditScope ) {
			submitForm( { preventDefault: () => {} } );
		}
	}, [ hasEditScope, autoSubmit, submitForm ] );

	return (
		<form
			className="googlesitekit-optimize-setup__form"
			onSubmit={ submitForm }
		>
			<p>{ __( 'Please copy and paste your Optimize ID to complete your setup.', 'google-site-kit' ) }
				<Link href="https://support.google.com/optimize/answer/6211921" external inherit>{ __( 'You can locate this here.', 'google-site-kit' ) }</Link>
			</p>

			<ErrorNotice />

			<div className="googlesitekit-setup-module__inputs">
				{ /* <OptimizeID /> */ }
			</div>

			<div className="googlesitekit-setup-module__action">
				<Button disabled={ ! canSubmitChanges }>
					{ __( 'Configure Optimize', 'google-site-kit' ) }
				</Button>
			</div>
		</form>
	);
}

SetupForm.propTypes = {
	finishSetup: PropTypes.func,
};

SetupForm.defaultProps = {
	finishSetup: () => {},
};
