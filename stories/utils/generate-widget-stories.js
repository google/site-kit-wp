/**
 * Utility function to generate stories for widgets.
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
import { storiesOf, Story } from '@storybook/react';

/**
 * Internal dependencies
 */
import { CORE_USER } from '../../assets/js/googlesitekit/datastore/user/constants';
import {
	createTestRegistry,
	WithTestRegistry,
	provideModules,
	provideSiteInfo,
} from '../../tests/js/utils';
import { getWidgetComponentProps } from '../../assets/js/googlesitekit/widgets/util';

/**
 * Generates stories for a report based widget using provided data.
 *
 * @since 1.16.0
 * @private
 *
 * @param {Object}      args                              Widget arguments.
 * @param {Array}       args.moduleSlugs                  List of modules to activate.
 * @param {string}      args.datastore                    Module datastore name.
 * @param {string}      args.group                        Stories group name.
 * @param {Array}       args.data                         Widget data.
 * @param {Object}      args.options                      Arguments for report requests.
 * @param {WPComponent} args.Component                    Widget component.
 * @param {string}      [args.referenceDate]              Reference date string to use, if not today.
 * @param {boolean}     [args.wrapWidget]                 Whether to wrap in default <Widget> component. Default true.
 * @param {Array}       [args.additionalVariants]         Optional. Additional story variants.
 * @param {Array}       [args.additionalVariantCallbacks] Optional. Additional custom callbacks to be run for each of the variants.
 * @param {Function}    [args.setup]                      Optional. Setup function to be run for all Stories being generated.
 * @param {Function}    [args.zeroing]                    Optional. Utility function to be run for Zero Data story to set report values to zero.
 * @param {number}      [args.padding]                    Optional. Can be used to alter padding around component (nomrally to set to 0).
 * @return {Story} Generated story.
 */
export function generateReportBasedWidgetStories( args ) {
	const {
		moduleSlugs,
		datastore,
		group,
		data,
		options,
		Component,
		referenceDate,
		wrapWidget = true,
		defaultVariantOptions = {},
		additionalVariants = {},
		additionalVariantCallbacks = {},
		setup = () => {},
		zeroing,
		padding,
	} = args;

	const stories = storiesOf( group, module );

	const withRegistry = ( variantName ) => ( StoryComponent ) => {
		const registry = createTestRegistry();
		// Activate the module.
		provideModules(
			registry,
			moduleSlugs.map( ( module ) => {
				return {
					slug: module,
					active: true,
					connected: true,
				};
			} )
		);

		let currentEntityURL = null;
		if ( Array.isArray( options ) && options[ 0 ].url ) {
			currentEntityURL = options[ 0 ].url;
		} else if ( options.url ) {
			currentEntityURL = options.url;
		}

		// Set some site information.
		provideSiteInfo( registry, {
			currentEntityURL,
		} );

		if ( referenceDate ) {
			registry.dispatch( CORE_USER ).setReferenceDate( referenceDate );
		}

		// Call the optional setup function.
		setup( registry, variantName );

		return <StoryComponent registry={ registry } />;
	};

	if ( Array.isArray( options ) ) {
		// 	If options is an array, so must data.
		if ( ! Array.isArray( data ) ) {
			throw new Error( 'options is an array, data must be one too' );
		}
		// Both must have the same length.
		if ( options.length !== data.length ) {
			throw new Error(
				'options and data must have the same number of items'
			);
		}
	}

	const {
		Loaded: additionalLoadedCallback,
		Loading: additionalLoadingCallback,
		DataUnavailable: additionalDataUnavailableCallback,
		ZeroData: additionalZeroDataCallback,
		Error: additionalErrorCallback,
	} = additionalVariantCallbacks;

	// Existing default variants.
	const defaultVariants = {
		Loaded: {
			...defaultVariantOptions.Loaded,
			callback( { dispatch } ) {
				if ( Array.isArray( options ) ) {
					options.forEach( ( option, index ) => {
						dispatch( datastore ).receiveGetReport( data[ index ], {
							options: option,
						} );
					} );
				} else {
					dispatch( datastore ).receiveGetReport( data, { options } );
				}

				// Run additional callback if it exists.
				if ( additionalLoadedCallback ) {
					additionalLoadedCallback( dispatch, data, options );
				}
			},
		},
		Loading: {
			...defaultVariantOptions.Loading,
			callback( { dispatch } ) {
				if ( Array.isArray( options ) ) {
					options.forEach( ( option, index ) => {
						dispatch( datastore ).receiveGetReport( data[ index ], {
							options: option,
						} );
						dispatch( datastore ).startResolution( 'getReport', [
							option,
						] );
					} );
				} else {
					dispatch( datastore ).receiveGetReport( data, { options } );
					dispatch( datastore ).startResolution( 'getReport', [
						options,
					] );
				}

				// Run additional callback if it exists.
				if ( additionalLoadingCallback ) {
					additionalLoadingCallback( dispatch, data, options );
				}
			},
		},
		DataUnavailable: {
			...defaultVariantOptions.DataUnavailable,
			callback( { dispatch } ) {
				if ( Array.isArray( options ) ) {
					options.forEach( ( option, index ) => {
						const returnType = Array.isArray( data[ index ] )
							? []
							: {};
						dispatch( datastore ).receiveGetReport( returnType, {
							options: option,
						} );
					} );
				} else {
					dispatch( datastore ).receiveGetReport( [], { options } );
				}

				// Run additional callback if it exists.
				if ( additionalDataUnavailableCallback ) {
					additionalDataUnavailableCallback(
						dispatch,
						data,
						options
					);
				}
			},
		},
		ZeroData:
			typeof zeroing === 'function'
				? {
						...defaultVariantOptions.ZeroData,
						callback: ( { dispatch } ) => {
							if ( Array.isArray( options ) ) {
								options.forEach( ( option, index ) => {
									dispatch( datastore ).receiveGetReport(
										zeroing( data[ index ], option ),
										{
											options: option,
										}
									);
								} );
							} else {
								dispatch( datastore ).receiveGetReport(
									zeroing( data, options ),
									{
										options,
									}
								);
							}

							// Run additional callback if it exists.
							if ( additionalZeroDataCallback ) {
								additionalZeroDataCallback(
									dispatch,
									data,
									options
								);
							}
						},
				  }
				: undefined,
		Error: {
			...defaultVariantOptions.Error,
			callback( { dispatch } ) {
				const error = {
					code: 'missing_required_param',
					message: 'Request parameter is empty: metrics.',
					data: {},
				};

				if ( Array.isArray( options ) ) {
					options.forEach( ( option, index ) => {
						if ( index === 0 ) {
							dispatch( datastore ).receiveError(
								error,
								'getReport',
								[ option ]
							);
							dispatch( datastore ).finishResolution(
								'getReport',
								[ option ]
							);
						} else {
							dispatch( datastore ).receiveGetReport(
								data[ index ],
								{
									options: option,
								}
							);
						}
					} );
				} else {
					dispatch( datastore ).receiveError( error, 'getReport', [
						options,
					] );
					dispatch( datastore ).finishResolution( 'getReport', [
						options,
					] );
				}

				// Run additional callback if it exists.
				if ( additionalErrorCallback ) {
					additionalErrorCallback( dispatch, data, options );
				}
			},
		},
	};

	// Custom variants.
	const customVariants = {};
	Object.keys( additionalVariants ).forEach( ( name ) => {
		const {
			data: variantData,
			options: variantOptions,
			features,
			storyName,
		} = additionalVariants[ name ] || {};

		if ( Array.isArray( variantOptions ) ) {
			// 	If variantOptions is an array, so must variantData.
			if ( ! Array.isArray( variantData ) ) {
				throw new Error(
					`options for variant "${ name }" is an array, data must be one too`
				);
			}
			// Both must have the same length.
			if ( variantOptions.length !== variantData.length ) {
				throw new Error(
					`options and data for variant "${ name }" must have the same number of items`
				);
			}
		}

		customVariants[ name ] = {
			callback: ( { dispatch } ) => {
				if ( Array.isArray( variantOptions ) ) {
					variantOptions.forEach( ( variantOption, index ) => {
						dispatch( datastore ).receiveGetReport(
							variantData[ index ],
							{ options: variantOption }
						);
					} );
				} else if ( variantData ) {
					dispatch( datastore ).receiveGetReport( variantData, {
						options: variantOptions,
					} );
				}

				// Run additional callback if it exists.
				if ( additionalVariantCallbacks[ name ] ) {
					additionalVariantCallbacks[ name ](
						dispatch,
						data,
						options
					);
				}
			},
			features,
			storyName,
		};
	} );

	const variants = {
		...defaultVariants,
		...customVariants,
	};

	let widgetElement;

	const slug = moduleSlugs
		.map( ( mapSlug ) => `${ mapSlug }-widget` )
		.join( ' ' );
	const widgetComponentProps = getWidgetComponentProps( slug );

	if ( wrapWidget ) {
		const { Widget } = widgetComponentProps;
		widgetElement = (
			<Widget>
				<Component { ...widgetComponentProps } />
			</Widget>
		);
	} else {
		widgetElement = <Component { ...widgetComponentProps } />;
	}

	Object.keys( variants ).forEach( ( variant ) => {
		if ( ! variants[ variant ] ) {
			return;
		}

		stories.add(
			variants[ variant ].storyName ||
				variant.replace( /([a-z])([A-Z])/, '$1 $2' ),
			( _, { registry } ) => (
				<WithTestRegistry
					registry={ registry }
					callback={ variants[ variant ].callback }
					features={ variants[ variant ].features || [] }
				>
					{ widgetElement }
				</WithTestRegistry>
			),
			{
				decorators: [ withRegistry( variant ) ],
				padding,
			}
		);
	} );

	return stories;
}

/**
 * Creates and returns a new report data generator using provided factory function.
 *
 * @since 1.28.0
 *
 * @param {Function} factory The factory function.
 * @return {Function} The report data generator.
 */
export function makeReportDataGenerator( factory ) {
	return ( options ) => {
		const results = { options };

		if ( Array.isArray( options ) ) {
			results.data = [];
			for ( let i = 0; i < options.length; i++ ) {
				results.data.push( factory( options[ i ] ) );
			}
		} else {
			results.data = factory( options );
		}

		return results;
	};
}
