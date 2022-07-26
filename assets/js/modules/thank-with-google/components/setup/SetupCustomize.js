/**
 * Thank with Google SetupCustomize component.
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
import { MODULES_THANK_WITH_GOOGLE } from '../../datastore/constants';
import Button from '../../../../components/Button';
const { useDispatch, useSelect } = Data;

export default function SetupCustomize( props ) {
	const { finishSetup } = props;

	const canSubmitChanges = useSelect( ( select ) =>
		select( MODULES_THANK_WITH_GOOGLE ).canSubmitChanges()
	);

	const { submitChanges } = useDispatch( MODULES_THANK_WITH_GOOGLE );

	const handleSubmitChanges = useCallback( async () => {
		const { error } = await submitChanges();
		if ( ! error ) {
			finishSetup?.();
		}
	}, [ submitChanges, finishSetup ] );

	return (
		<Fragment>
			<div>TODO: UI for setup customize - SetupCustomize</div>
			<Button
				disabled={ ! canSubmitChanges }
				onClick={ handleSubmitChanges }
			>
				{ __( 'Configure Thank with Google', 'google-site-kit' ) }
			</Button>
		</Fragment>
	);
}

SetupCustomize.propTypes = {
	finishSetup: PropTypes.func,
};
