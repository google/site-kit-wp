/**
 * Subscribe with Google Account Create component.
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
import classnames from 'classnames';

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
import Link from '../../../../components/Link';
import Button from '../../../../components/Button';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { FORM_SETUP, STORE_NAME } from '../../datastore/constants';
import { TextField, Input } from '../../../../material-components';
const { useDispatch, useSelect } = Data;

const COUNTRY_LIST_URL = '#';

export default function AccountCreate() {
	const nextHandler = useCallback( () => {
		// Need to use window.open for this to allow for stubbing in E2E.
		global.window.open( '#', '_blank' );
	}, [ '#' ] );

	const publicationID = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_SETUP, 'publicationID' ) );

	const { setValues } = useDispatch( CORE_FORMS );
	const onChange = useCallback( ( { currentTarget } ) => {
		setValues( FORM_SETUP, { publicationID: currentTarget.value } );
	}, [ 'publicationID' ] );

	return (
		<div>
			<StoreErrorNotices moduleSlug="tagmanager" storeName={ STORE_NAME } />

			<h4>
				{ __( '1) Check requirements', 'google-site-kit' ) }
			</h4>
			<p>
				{ __( 'In order to use this service, make sure you meet these requirements:', 'google-site-kit' ) }
			</p>
			<ul>
				<li>
					{ __( '- Should not have an associated Android app', 'google-site-kit' ) }
				</li>
				<li>
					{ __( '- Be located in a country with verified bank accounts', 'google-site-kit' ) }
					&nbsp;
					&nbsp;
					<Link className="googlesitekit-help-link" href={ COUNTRY_LIST_URL } external>
						{ __( 'See full country list', 'google-site-kit' ) }
					</Link>
				</li>
				<li>
					{ __( '- No existing subscription product', 'google-site-kit' ) }
				</li>
			</ul>

			<div className="googlesitekit-setup-module__action">
				<Button onClick={ nextHandler }>
					{ __( 'Next', 'google-site-kit' ) }
				</Button>
			</div>

			<h4>
				{ __( '2) Set up Publisher Center account', 'google-site-kit' ) }
			</h4>
			<p>
				{ __( 'You need to create a Google Publisher Center account to continue set up.', 'google-site-kit' ) }
				&nbsp;
				&nbsp;
				<Link className="googlesitekit-help-link" href={ COUNTRY_LIST_URL } external>
					{ __( 'Learn more', 'google-site-kit' ) }
				</Link>
			</p>
			<p>
				<Link href={ COUNTRY_LIST_URL } external>
					{ __( 'Create Publisher Center account', 'google-site-kit' ) }
				</Link>
			</p>
			<TextField
				className={ classnames( { 'mdc-text-field--error': ! publicationID } ) }
				label={ 'Publication ID' }
				outlined
			>
				<Input
					id={ 'publicationID' }
					name={ 'publicationID' }
					value={ publicationID }
					onChange={ onChange }
				/>
			</TextField>
			<div className="googlesitekit-setup-module__action">
				<Button onClick={ nextHandler } disabled={ ! publicationID }>
					{ __( 'Done', 'google-site-kit' ) }
				</Button>
			</div>

		</div>
	);
}
