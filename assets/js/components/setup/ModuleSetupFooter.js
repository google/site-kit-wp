/**
 * ModuleSetupFooter component.
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { Cell, Grid, Row } from '../../material-components';
import Link from '../Link';
import SpinnerButton from '../../googlesitekit/components-gm2/SpinnerButton';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';

export default function ModuleSetupFooter( { module, onCancel, onComplete } ) {
	const [ isSaving, setIsSaving ] = useState( false );

	const settingsPageURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-settings' )
	);
	const isSetupBlocked = useSelect( ( select ) =>
		select( module?.storeName )?.isSetupBlocked?.()
	);

	const canSubmitChanges = useSelect( ( select ) =>
		select( CORE_MODULES ).canSubmitChanges( module?.slug )
	);

	const onCompleteSubmit = useCallback( async () => {
		setIsSaving( true );

		await onComplete();

		setIsSaving( false );
	}, [ setIsSaving, onComplete ] );

	if ( ! module ) {
		return null;
	}

	return (
		<div
			className={ classnames(
				'googlesitekit-setup__footer',
				`googlesitekit-setup__footer--${ module?.slug }`
			) }
		>
			<Grid>
				<Row>
					<Cell alignMiddle smSize={ 2 } mdSize={ 4 } lgSize={ 6 }>
						<Link
							id={ `setup-${ module.slug }-cancel` }
							href={ settingsPageURL }
							onClick={ onCancel }
						>
							{ isSetupBlocked
								? __( 'Back', 'google-site-kit' )
								: __( 'Cancel', 'google-site-kit' ) }
						</Link>
					</Cell>
					{ onComplete && (
						<Cell alignRight smSize={ 2 } mdSize={ 4 } lgSize={ 6 }>
							<SpinnerButton
								id={ `setup-${ module.slug }-complete` }
								onClick={ onCompleteSubmit }
								disabled={ ! canSubmitChanges || isSaving }
								isSaving={ isSaving }
							>
								{ __( 'Complete Setup', 'google-site-kit' ) }
							</SpinnerButton>
						</Cell>
					) }
				</Row>
			</Grid>
		</div>
	);
}

ModuleSetupFooter.propTypes = {
	module: PropTypes.shape( {
		slug: PropTypes.string.isRequired,
		storeName: PropTypes.string.isRequired,
	} ).isRequired,
	onCancel: PropTypes.func.isRequired,
};
