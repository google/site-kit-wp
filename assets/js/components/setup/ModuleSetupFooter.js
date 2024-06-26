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

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { Cell, Grid, Row } from '../../material-components';
import Link from '../Link';

export default function ModuleSetupFooter( { module, onCancel } ) {
	const settingsPageURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-settings' )
	);
	const isSetupBlocked = useSelect( ( select ) =>
		select( module?.storeName )?.isSetupBlocked?.()
	);

	if ( ! module ) {
		return null;
	}

	return (
		<div className="googlesitekit-setup__footer">
			<Grid>
				<Row>
					<Cell smSize={ 2 } mdSize={ 4 } lgSize={ 6 }>
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
