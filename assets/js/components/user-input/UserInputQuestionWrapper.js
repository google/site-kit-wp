/**
 * User Input Question Wrapper.
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME as CORE_USER } from '../../googlesitekit/datastore/user/constants';
import Button from '../Button';
import { Row, Cell } from '../../material-components';
import UserInputQuestionInfo from './UserInputQuestionInfo';
const { useSelect } = Data;

export default function UserInputQuestionWrapper( props ) {
	const {
		children,
		slug,
		isActive,
		questionNumber,
		title,
		description,
		next,
		nextLabel,
		back,
		backLabel,
	} = props;

	const values = useSelect( ( select ) => select( CORE_USER ).getUserInputSetting( slug ) || [] );
	const scope = useSelect( ( select ) => select( CORE_USER ).getUserInputSettingScope( slug ) );
	const author = useSelect( ( select ) => select( CORE_USER ).getUserInputSettingAuthor( slug ) );

	return (
		<div className={ classnames(
			'googlesitekit-user-input__question',
			{
				'googlesitekit-user-input__question--active': isActive,
				'googlesitekit-user-input__question--next': ! isActive,
			}
		) }>
			<Row>
				<Cell lgSize={ 12 } mdSize={ 8 } smSize={ 4 }>
					<Row>
						{ title && (
							<UserInputQuestionInfo
								title={ title }
								description={ description }
								scope={ scope }
								questionNumber={ questionNumber }
								author={ author }
							/>
						) }

						{ children }
					</Row>

					{ isActive && (
						<div className="googlesitekit-user-input__buttons">
							{ back && (
								<Button text onClick={ back }>
									{ backLabel || __( 'Back', 'google-site-kit' ) }
								</Button>
							) }
							{ next && (
								<Button
									onClick={ next }
									disabled={ values.filter( ( value ) => value.trim().length > 0 ).length === 0 }
								>
									{ nextLabel || __( 'Next', 'google-site-kit' ) }
								</Button>
							) }
						</div>
					) }
				</Cell>
			</Row>
		</div>
	);
}

UserInputQuestionWrapper.propTypes = {
	slug: PropTypes.string.isRequired,
	questionNumber: PropTypes.number.isRequired,
	children: PropTypes.node,
	isActive: PropTypes.bool,
	title: PropTypes.string,
	description: PropTypes.string,
	next: PropTypes.func,
	nextLabel: PropTypes.string,
	back: PropTypes.func,
	backLabel: PropTypes.string,
};
