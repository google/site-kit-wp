/**
 * Thank with Google Setup Form component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import Button from '../../../../components/Button';
import { STORE_NAME } from '../../datastore/constants';
import {
	ProductsInput,
	PublicationIDInput,
	RevenueModelDropdown,
} from '../common';
const { useDispatch, useSelect } = Data;

export default function SetupForm( { finishSetup } ) {
	// Get validation function.
	const canSubmitChanges = useSelect( ( select ) =>
		select( STORE_NAME ).canSubmitChanges()
	);

	// Handle form submissions.
	const { submitChanges } = useDispatch( STORE_NAME );
	const submitForm = useCallback(
		( e ) => {
			e.preventDefault();
			submitChanges();
			finishSetup();
		},
		[ submitChanges, finishSetup ]
	);

	return (
		<form
			className="googlesitekit-analytics-setup__form"
			onSubmit={ submitForm }
		>
			<StoreErrorNotices
				moduleSlug="thank-with-google"
				storeName={ STORE_NAME }
			/>

			<div className="googlesitekit-setup-module__inputs">
				<PublicationIDInput />
			</div>

			<div className="googlesitekit-setup-module__inputs">
				<RevenueModelDropdown />
			</div>

			<div className="googlesitekit-setup-module__inputs">
				<ProductsInput />
			</div>

			<div className="googlesitekit-setup-module__action">
				<Button disabled={ ! canSubmitChanges }>
					{ __(
						'Configure Subscribe with Google',
						'google-site-kit'
					) }
				</Button>
			</div>
		</form>
	);
}

SetupForm.propTypes = {
	finishSetup: PropTypes.func,
};

SetupForm.defaultProps = {};
