/**
 * Site Kit by Google, Copyright 2025 Google LLC
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
 * Internal dependencies
 */
import GoogleLogoIcon from '../../../assets/svg/graphics/logo-g.svg';

// Styles copied over from the actual inline button.
// TODO: These inline styles should be removed once we are enqueuing the corresponding stylesheet in the site editor.
const buttonStyles = {
	alignItems: 'center',
	backgroundColor: '#fff',
	border: '1px solid #dadce0',
	borderRadius: '4px',
	color: '#1a73e8',
	display: 'flex',
	fontFamily: 'Google Sans, Roboto-Regular, sans-serif, arial',
	fontSize: '14px',
	fontWeight: 500,
	justifyContent: 'center',
	letterSpacing: '0.014px',
	outline: '0',
	padding: '12px 34px',
};

const disabledStyles = {
	filter: 'grayscale(50%)',
	opacity: 0.5,
};

const svgStyles = {
	marginRight: '8px',
};

export default function EditorButton( { children, disabled } ) {
	const style = disabled
		? { ...buttonStyles, ...disabledStyles }
		: buttonStyles;

	return (
		<button
			disabled={ disabled }
			style={ style }
			className={ classnames(
				'googlesitekit-blocks-reader-revenue-manager-button',
				{
					'googlesitekit-blocks-reader-revenue-manager-button--disabled':
						disabled,
				}
			) }
		>
			<GoogleLogoIcon height="18" width="18" style={ svgStyles } />
			{ children }
		</button>
	);
}
