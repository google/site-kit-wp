/**
 * Utility function to generate stories for widgets.
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
import { storiesOf, Story } from '@storybook/react';
import { Component } from 'react';

/**
 * Internal dependencies
 */
import Widgets from 'googlesitekit-widgets';
import { STORE_NAME as CORE_SITE } from '../../assets/js/googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_MODULES } from '../../assets/js/googlesitekit/modules/datastore/constants';
import { WithTestRegistry } from '../../tests/js/utils';
const { components: { Widget } } = Widgets;

/**
 * Generates a function to set up registry for widget stories.
 *
 * @since 1.16.0
 *
 * @param {(string|Array)} moduleSlug Module slug or slugs to activate.
 * @param {string|null}    url        Current entity URL.
 * @param {Function}       [cb]       Callback for additional setup. Default is no-op.
 * @return {Function} A function to set up registry for widget stories.
 */
function getSetupRegistry( moduleSlug, url, cb = () => {} ) {
	return ( { dispatch } ) => {
		cb( { dispatch } );

		dispatch( CORE_SITE ).receiveSiteInfo( {
			referenceSiteURL: null,
			currentEntityURL: url,
		} );

		let modules = [];
		if ( Array.isArray( moduleSlug ) ) {
			modules = moduleSlug.map( ( module ) => {
				return {
					slug: module,
					active: true,
					connected: true,
				};
			} );
		} else {
			modules = [
				{
					slug: moduleSlug,
					active: true,
					connected: true,
				},
			];
		}
		dispatch( CORE_MODULES ).receiveGetModules( modules );
	};
}

/**
 * Generates stories for a report based widget using provided data.
 *
 * @since 1.16.0
 *
 * @param {Object}    args                              Widget arguments.
 * @param {string}    args.moduleSlug                   Module slug.
 * @param {string}    args.datastore                    Module datastore name.
 * @param {string}    args.group                        Stories group name.
 * @param {Array}     args.data                         Widget data.
 * @param {Object}    args.options                      Arguments for report requests.
 * @param {Component} args.component                    Widget component.
 * @param {boolean}   [args.wrapWidget]                 Whether to wrap in default <Widget> component. Default true.
 * @param {Array}     [args.additionalVariants]         Optional. Additional story variants.
 * @param {Array}     [args.additionalVariantCallbacks] Optional. Additional custom callbacks to be run for each of the variants
 * @return {Story} Generated story.
 */
export function generateReportBasedWidgetStories( {
	moduleSlug,
	datastore,
	group,
	data,
	options,
	component: WidgetComponent,
	wrapWidget = true,
	additionalVariants = {},
	additionalVariantCallbacks = {},
} ) {
	const stories = storiesOf( group, module );

	if ( Array.isArray( options ) ) {
		// 	If options is an array, so must data.
		if ( ! Array.isArray( data ) ) {
			throw new Error( 'options is an array, data must be one too' );
		}
		// Both must have the same length.
		if ( options.length !== data.length ) {
			throw new Error( 'options and data must have the same number of items' );
		}
	}

	const {
		Loaded: additionalLoadingCallback,
		'Data Unavailable': additionalDataUnavailableCallback,
		Error: additionalErrorCallback,
	} = additionalVariantCallbacks;

	// Existing default variants.
	const defaultVariants = {
		Loaded: ( { dispatch } ) => {
			if ( Array.isArray( options ) ) {
				options.forEach( ( option, index ) => {
					dispatch( datastore ).receiveGetReport( data[ index ], { options: option } );
				} );
			} else {
				dispatch( datastore ).receiveGetReport( data, { options } );
			}

			// Run additional callback if it exists.
			if ( additionalLoadingCallback ) {
				additionalLoadingCallback( dispatch, data, options );
			}
		},
		'Data Unavailable': ( { dispatch } ) => {
			if ( Array.isArray( options ) ) {
				options.forEach( ( option, index ) => {
					const returnType = Array.isArray( data[ index ] ) ? [] : {};
					dispatch( datastore ).receiveGetReport( returnType, { options: option } );
				} );
			} else {
				dispatch( datastore ).receiveGetReport( [], { options } );
			}

			// Run additional callback if it exists.
			if ( additionalDataUnavailableCallback ) {
				additionalDataUnavailableCallback( dispatch, data, options );
			}
		},
		Error: ( { dispatch } ) => {
			const error = {
				code: 'missing_required_param',
				message: 'Request parameter is empty: metrics.',
				data: {},
			};
			if ( Array.isArray( options ) ) {
				options.forEach( ( option ) => {
					dispatch( datastore ).receiveError( error, 'getReport', [ option ] );
					dispatch( datastore ).finishResolution( 'getReport', [ option ] );
				} );
			} else {
				dispatch( datastore ).receiveError( error, 'getReport', [ options ] );
				dispatch( datastore ).finishResolution( 'getReport', [ options ] );
			}

			// Run additional callback if it exists.
			if ( additionalErrorCallback ) {
				additionalErrorCallback( dispatch, data, options );
			}
		},
	};

	// Custom variants.
	const customVariants = {};
	Object.keys( additionalVariants ).forEach( ( name ) => {
		const { data: variantData, options: variantOptions } = additionalVariants[ name ];

		if ( Array.isArray( variantOptions ) ) {
			// 	If variantOptions is an array, so must variantData.
			if ( ! Array.isArray( variantData ) ) {
				throw new Error( `options for variant "${ name }" is an array, data must be one too` );
			}
			// Both must have the same length.
			if ( variantOptions.length !== variantData.length ) {
				throw new Error( `options and data for variant "${ name }" must have the same number of items` );
			}
		}

		customVariants[ name ] = ( { dispatch } ) => {
			if ( Array.isArray( variantOptions ) ) {
				variantOptions.forEach( ( variantOption, index ) => {
					dispatch( datastore ).receiveGetReport( variantData[ index ], { options: variantOption } );
				} );
			} else {
				dispatch( datastore ).receiveGetReport( variantData, { options: variantOptions } );
			}

			// Run additional callback if it exists.
			if ( additionalVariantCallbacks[ name ] ) {
				additionalVariantCallbacks[ name ]( dispatch, data, options );
			}
		};
	} );

	const variants = {
		...defaultVariants,
		...customVariants,
	};

	let widget;
	if ( wrapWidget ) {
		widget = (
			<Widget slug={ `${ moduleSlug }-widget` }>
				<WidgetComponent />
			</Widget>
		);
	} else {
		widget = <WidgetComponent />;
	}

	Object.keys( variants ).forEach( ( variant ) => {
		stories.add( variant, () => (
			<WithTestRegistry callback={ getSetupRegistry( moduleSlug, options.url || null, variants[ variant ] ) }>
				{ widget }
			</WithTestRegistry>
		) );
	} );

	return stories;
}
