/**
 * User Input Question.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME as CORE_USER } from '../../googlesitekit/datastore/user/constants';
import Button from '../button';
const { useSelect } = Data;

export default function UserInputQuestion( { slug, isActive, next, back } ) {
	const values = useSelect( ( select ) => select( CORE_USER ).getUserInputSetting( slug ) || [] );

	return (
		<div className="mdc-layout-grid__inner">
			<div className="
				mdc-layout-grid__cell
				mdc-layout-grid__cell--span-12-desktop
				mdc-layout-grid__cell--span-8-tablet
				mdc-layout-grid__cell--span-4-phone
			">
				{ JSON.stringify( [ slug, values ] ) }
				{
					isActive &&
					<div>
						{
							back &&
							<Button onClick={ back }>
								{ __( 'Back', 'google-site-kit' ) }
							</Button>
						}
						{
							next &&
							<Button
								onClick={ next }
								disabled={ ! values.length }
							>
								{ __( 'Next', 'google-site-kit' ) }
							</Button>
						}
					</div>
				}
			</div>
		</div>
	);
}

UserInputQuestion.propTypes = {
	slug: PropTypes.string.isRequired,
	isActive: PropTypes.bool,
	next: PropTypes.func,
	back: PropTypes.func,
};
