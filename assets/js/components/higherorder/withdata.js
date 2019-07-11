/**
 * withData higher-order component.
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

import getNoDataComponent from 'GoogleComponents/notifications/nodata';
import getDataErrorComponent from 'GoogleComponents/notifications/data-error';
import getSetupIncompleteComponent from 'GoogleComponents/notifications/setup-incomplete';

const {
	addFilter,
	addAction,
} = wp.hooks;
const { each, isArray }  = lodash;
const { Component } = wp.element;
const { __ } = wp.i18n;

/**
 * A Higher order Component that provides data functionality to Components.
 *
 * This function takes a React Component that is data dependent, resolving via the data API.
 *
 * Automatically detects data errors, displaying an error CTA Component. Components can extend the default
 * error handling to enable custom error messaging or data shapes.
 *
 * Components can provide a callback that checks if the data is "zero" - typically when an account is newly established and not yet providing data. In most cases the API returns all 0s, however some APIs may return empty strings or null.
 *
 * Components can optionally include `handleDataError` and `handleDataSuccess` function as props. `handleDataError` will be
 * called with the error message string if there is a data error and called with no string if the data is empty.
 * `handleDataSuccess` will be called when data resolves correctly.
 *
 * @param {React.Component} DataDependentComponent The React Component to render once we have its required data.
 * @param {array}           selectData             An array of data objects to resolve.
 *                                                 Each object includes the following properties:
 *                                                 {string}         dataObject The object type, eg 'modules'.
 *                                                 {string}         identifier The object name, typically the module name eg 'analytics.
 *                                                 {string}         datapoint  The datapoint name to be resolved by the API.
 *                                                 {string}         permaLink  The current page permaLink if available. Optional.
 *                                                 {number}         postID     The current postID. Optional.
 *                                                 {number}         priority   The data request priority, used for batching.
 *                                                 {number}         maxAge     How long to cache the data results.
 *                                                 {string | array} context    The context(s) to resolve data, eg 'Dashboard'.
 *
 * @param {React.Component} loadingComponent       A React Component to render while the data is resolving.
 * @param {object}          layoutOptions          An object with layout options that are passed to the getNoDataComponent and getDataErrorComponent components.
 * @param {function}        isDataZero             A callback function that is passed the resolved data and returns true
 *                                                 if the data is "zero".
 * @param {function}        getDataError           A callback function that is passed the resolved data and returns the
 *                                                 error message.

 *
 */
const withData = (
	DataDependentComponent,
	selectData,
	loadingComponent = null,

	layoutOptions = {
		inGrid: false,
		fullWidth: false,
		createGrid: false,
	},

	// The default isDataZero handler always returns false, Components must define when data is zero.
	// `isDataZero` is passed `returnedData`and `datapoint`.
	isDataZero = () => {
		return false;
	},

	// The default getDataError handler detects data.error and extracts the message from data.error.message or data.error.errors[0].message.
	getDataError = ( data ) => {
		if ( data && data.error ) {
			if ( data.error.message ) {
				return data.error.message;
			}
			if ( data.error.errors && data.error.errors[0] && data.error.errors[0].message ) {
				return data.error.errors[0].message;
			}
			return __( 'Unidentified error', 'google-site-kit' );
		}

		if ( data && data.errors && data.errors[0] && data.errors[0].message ) {
			return data.errors[0].message;
		}

		if ( data && data.error_data ) {
			const errors = Object.values( data.error_data );

			// Catch RateLimitExceeded specifically.
			if ( errors[0] && 'RateLimitExceeded' === errors[0].reason ) {
				return __( 'Too many requests have been sent within a given time span. Please reload this page again in a few seconds', 'google-site-kit' );
			}
		}

		if ( data && data.errors ) {
			const errors = Object.values( data.errors );
			if ( errors[0] && errors[0][0] ) {
				return errors[0][0];
			}
		}

		// No error.
		return false;
	}
) => {

	// ...and returns another component...
	return class NewComponent extends Component {
		constructor( props ) {
			super( props );

			this.state = {
				data: false,
				zeroData: false,
				error: false,
			};

			addAction(
				'googlesitekit.moduleDataReset',
				'googlesitekit.moduleDataResetHandler',
				() => {
					this.setState( { data: false } );
				}
			);

			/**
			 * Handle a single datapoint returned from the data API.
			 *
			 * Each resolved data point is passed thru this handler to detect errors and zero data conditions, and
			 * to trigger `handleDataError` and `handleDataSuccess` helpers.
			 *
			 * @param {object} returnedData The data returned from the API.
			 * @param {string} datapoint    The datapoint name resolved by the API.
			 * @param {string} identifier   The object name, typically the module name eg 'analytics.
			 */
			const handleReturnedData = ( returnedData, datapoint, identifier ) => {

				// If available, `handleDataError` will be called for errors (with a string) and empty data.
				const {
					handleDataError,
					handleDataSuccess,
				} = this.props;

				// Check to see if the returned data is an error. If so, getDataError will return a string.
				const error = getDataError( returnedData );
				if ( error ) {

					// Set an error state on the Component.
					this.setState( {
						error,
						module: identifier,
					} );

					// If the Component included a `handleDataError` helper, pass it the error message.
					handleDataError && handleDataError( error );

				} else if ( isDataZero( returnedData, datapoint ) ) { // No data error, next check for zero data.

					// If we have a `handleDataError` call it without any parameters (indicating empty data).
					handleDataError && handleDataError( error );

					// Set a zeroData state on the Component.
					this.setState( { zeroData: true } );
				} else {

					// Success! `handleDataSuccess` will be called (ie. not error or zero).
					handleDataSuccess && handleDataSuccess();
				}

				// Resolve the returned data my setting state on the Component.
				this.setState( {
					data: returnedData,
					datapoint,
					module: identifier,
				} );

			};

			// Resolve all selectedData.
			each( selectData, ( data ) => {

				// Handle single contexts, or arrays of contexts.
				if ( isArray( data.context ) ) {

					each( data.context,  ( acontext ) => {

						/**
						 * Request data for the context.
						 */
						addFilter( `googlesitekit.module${ acontext }DataRequest`,
							`googlesitekit.data${ acontext }`, ( moduleData ) => {
								data.callback = ( returnedData, datapoint ) => {
									handleReturnedData ( returnedData, datapoint, data.identifier );
								};
								moduleData.push( data );
								return moduleData;
							} );
					} );
				} else {

					/**
					 * Request data for the context.
					 */
					addFilter( `googlesitekit.module${ data.context }DataRequest`,
						`googlesitekit.data${ data.context }`, ( moduleData ) => {

							data.callback = ( returnedData, datapoint ) => {
								handleReturnedData ( returnedData, datapoint, data.identifier );
							};
							moduleData.push( data );
							return moduleData;
						} );
				}
			} );
		}

		render() {
			const {
				data,
				datapoint,
				module,
				zeroData,
				error,
			} = this.state;

			// Render the loading component until we have data.
			if ( ! data ) {
				return loadingComponent;
			}

			const moduleName = module ? googlesitekit.modules[ module ].name : __( 'Site Kit', 'google-site-kit' );

			// If module is active but setup not complete.
			if ( module && googlesitekit.modules[ module ].active && ! googlesitekit.modules[ module ].setupComplete ) {
				return getSetupIncompleteComponent( moduleName, layoutOptions.inGrid, layoutOptions.fullWidth, layoutOptions.createGrid );
			}

			// If we have an error, display the DataErrorComponent.
			if ( error ) {
				return ( 'string' !== typeof error ) ? error : getDataErrorComponent( moduleName, error, layoutOptions.inGrid, layoutOptions.fullWidth, layoutOptions.createGrid );
			}

			// If we have zeroData, display the NoDataComponent.
			if ( zeroData ) {
				return getNoDataComponent( moduleName, layoutOptions.inGrid, layoutOptions.fullWidth, layoutOptions.createGrid );
			}

			// Render the Component when we have data, passing the datapoint.
			return (
				<DataDependentComponent
					data={ data }
					datapoint={ datapoint }
					{ ...this.props }
				/>
			);
		}
	};
};

export default withData;
