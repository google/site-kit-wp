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
 * WordPress dependencies
 */
import { useBlockProps, InspectorControls } from '@wordpress-core/block-editor';
import {
	PanelBody,
	SelectControl,
	TextControl,
} from '@wordpress-core/components';
import { Fragment } from '@wordpress-core/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	SIGN_IN_WITH_GOOGLE_SHAPES,
	SIGN_IN_WITH_GOOGLE_TEXTS,
	SIGN_IN_WITH_GOOGLE_THEMES,
} from '@/js/modules/sign-in-with-google/datastore/constants';
import SignInWithGoogleIcon from './icon.svg';

const DEFAULT_OPTION = {
	label: __( 'Default (use site settings)', 'google-site-kit' ),
	value: '',
};

/**
 * Sign in with Google Block Edit component.
 *
 * @since 1.147.0
 * @since n.e.x.t Added attributes, setAttributes, and className to props.
 *
 * @param {Object}   props               Component props.
 * @param {Object}   props.attributes    Block attributes.
 * @param {Function} props.setAttributes Block attribute setter.
 * @param {string}   props.className     Block class name.
 * @return {Element} Element to render.
 */
export default function Edit( { attributes, setAttributes, className } ) {
	const { shape, text, theme, buttonClassName } = attributes;
	const blockProps = useBlockProps( { className } );

	function createSelectOptions( options ) {
		return [ DEFAULT_OPTION, ...options ];
	}

	function handleSelectChange( attribute, value ) {
		setAttributes( { [ attribute ]: value || undefined } );
	}

	function handleClassChange( value ) {
		const sanitizedValue = value.trim();
		setAttributes( {
			buttonClassName: sanitizedValue ? sanitizedValue : undefined,
		} );
	}

	function createSelectChangeHandler( attribute ) {
		return function onChange( value ) {
			handleSelectChange( attribute, value );
		};
	}

	const dataAttributes = {
		...( shape ? { 'data-googlesitekit-siwg-shape': shape } : {} ),
		...( text ? { 'data-googlesitekit-siwg-text': text } : {} ),
		...( theme ? { 'data-googlesitekit-siwg-theme': theme } : {} ),
	};

	const combinedClassName = [
		'googlesitekit-blocks-sign-in-with-google',
		buttonClassName || '',
	]
		.filter( Boolean )
		.join( ' ' );

	return (
		<Fragment>
			<InspectorControls>
				<PanelBody
					title={ __( 'Button settings', 'google-site-kit' ) }
					initialOpen
				>
					<SelectControl
						label={ __( 'Button shape', 'google-site-kit' ) }
						value={ shape ?? '' }
						onChange={ createSelectChangeHandler( 'shape' ) }
						options={ createSelectOptions(
							SIGN_IN_WITH_GOOGLE_SHAPES
						) }
						// Opt in to new WP components styles (6.7–7.1):
						// __next40pxDefaultSize - use new 40px height (replaces deprecated 36px)
						// __nextHasNoMarginBottom - remove legacy bottom margin
						// Ref: https://github.com/WordPress/gutenberg/pull/61132
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
					<SelectControl
						label={ __( 'Button text', 'google-site-kit' ) }
						value={ text ?? '' }
						onChange={ createSelectChangeHandler( 'text' ) }
						options={ createSelectOptions(
							SIGN_IN_WITH_GOOGLE_TEXTS
						) }
						// Opt in to new WP components styles (6.7–7.1):
						// __next40pxDefaultSize - use new 40px height (replaces deprecated 36px)
						// __nextHasNoMarginBottom - remove legacy bottom margin
						// Ref: https://github.com/WordPress/gutenberg/pull/61132
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
					<SelectControl
						label={ __( 'Button theme', 'google-site-kit' ) }
						value={ theme ?? '' }
						onChange={ createSelectChangeHandler( 'theme' ) }
						options={ createSelectOptions(
							SIGN_IN_WITH_GOOGLE_THEMES
						) }
						// Opt in to new WP components styles (6.7–7.1):
						// __next40pxDefaultSize - use new 40px height (replaces deprecated 36px)
						// __nextHasNoMarginBottom - remove legacy bottom margin
						// Ref: https://github.com/WordPress/gutenberg/pull/61132
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
					<TextControl
						label={ __( 'HTML class', 'google-site-kit' ) }
						help={ __(
							'Add optional classes to customize the button in the editor and on the frontend.',
							'google-site-kit'
						) }
						value={ buttonClassName || '' }
						onChange={ handleClassChange }
						// Opt in to new WP components styles (6.7–7.1):
						// __next40pxDefaultSize - use new 40px height (replaces deprecated 36px)
						// __nextHasNoMarginBottom - remove legacy bottom margin
						// Ref: https://github.com/WordPress/gutenberg/pull/61132
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<div
					className={ combinedClassName }
					style={ { maxWidth: '180px', minWidth: '120px' } }
					{ ...dataAttributes }
				>
					<SignInWithGoogleIcon />
				</div>
			</div>
		</Fragment>
	);
}
