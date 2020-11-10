/**
 * ModuleSetupIncomplete component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import { withFilters } from '@wordpress/components';
import { Component, createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */

import {
	getReAuthURL,
} from '../../util';
import Link from '../Link';
import Data from 'googlesitekit-data';
const { select } = Data;
import { STORE_NAME as CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import classnames from 'classnames';
import ErrorIcon from '../../../svg/error.svg';

class ModuleSetupIncomplete extends Component {
	render() {
		const {
			slug,
		} = this.props;

		// @TODO: Resolver only runs once per set of args, so we are working around
		// this to rerun after modules are loaded.
		// Once #1769 is resolved, we can remove the call to getModules,
		// and remove the !! modules cache busting param.
		const modules = select( CORE_MODULES ).getModules();
		const canActivateModule = select( CORE_MODULES ).canActivateModule( slug, !! modules );
		const requirementsStatus = select( CORE_MODULES ).getCheckRequirementsStatus( slug, !! modules );
		const errorMessage = canActivateModule ? null : requirementsStatus;

		return (
			<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
				{ errorMessage &&
				<div
					className={ classnames( 'googlesitekit-settings-module-warning', 'googlesitekit-settings-module-warning--modules-list' ) } >
					<ErrorIcon height="20" width="23" /> { errorMessage }
				</div>
				}
				{ createInterpolateElement(
					sprintf(
						/* translators: %s: link with next step */
						__( 'Setup incomplete: %s', 'google-site-kit' ),
						`<a>${ __( 'continue module setup', 'google-site-kit' ) }</a>`
					),
					{
						a: <Link
							className="googlesitekit-settings-module__edit-button"
							onClick={ () => {
								global.location = getReAuthURL( slug, true );
							} }
							inherit
						/>,
					}
				) }
			</div>
		);
	}
}

export default withFilters( 'googlesitekit.ModuleSetupIncomplete' )( ModuleSetupIncomplete );
