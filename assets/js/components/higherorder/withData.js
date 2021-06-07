/**
 * `withData` higher-order component.
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
import castArray from 'lodash/castArray';
import memize from 'memize';

/**
 * WordPress dependencies
 */
import { addFilter, addAction, removeAction, removeFilter } from '@wordpress/hooks';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { getModulesData, stringifyObject } from '../../util';
import getNoDataComponent from '../legacy-notifications/nodata';
import getDataErrorComponent from '../legacy-notifications/data-error';
import getSetupIncompleteComponent, { getModuleInactiveComponent } from '../legacy-notifications/setup-incomplete';
import { TYPE_MODULES } from '../data/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { requestWithDateRange } from '../data/utils/request-with-date-range';
const { withSelect } = Data;

const hashRequests = memize( stringifyObject );

/**
 * Provides data from the API to components. (Legacy HOC.)
 *
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
 * @since 1.0.0
 *
 * @param {WPElement} DataDependentComponent The React Component to render once we have its required data.
 * @param {Array}     selectData             An array of data objects to resolve.
 *                                                 Each object includes the following properties:
 *                                                 {string}         type       The data type. Either 'core' or 'modules'.
 *                                                 {string}         identifier The data identifier, for example a module slug.
 *                                                 {string}         datapoint  The datapoint.
 *                                                 {Object?}        data       Optional arguments to pass along.
 *                                                 {number}         priority   The data request priority, used for batching.
 *                                                 {number}         maxAge     How long to cache the data results.
 *                                                 {string | array} context    The context(s) to resolve data, eg 'Dashboard'.
 *
 * @param {WPElement} loadingComponent       A React Component to render while the data is resolving.
 * @param {Object}    layoutOptions          An object with layout options that are passed to the getNoDataComponent and getDataErrorComponent components.
 * @param {Function}  isDataZero             A callback function that is passed the resolved data and returns true
 *                                                 if the data is "zero".
 * @param {Function}  getDataError           A callback function that is passed the resolved data and returns the
 *                                                 error message.
 * @return {WPElement} Component  	Returns React.Components based on data and state.
 *                                  If has data  	  Return DataDependentComponent with data.
 *                                  has no data		  Fallback message when no data.
 *                                  in loading state  Return loadingComponent.
 *                                  has an error	  Returns error.
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
			if ( data.error.errors && data.error.errors[ 0 ] && data.error.errors[ 0 ].message ) {
				return data.error.errors[ 0 ].message;
			}
			return __( 'Unidentified error', 'google-site-kit' );
		}

		if ( data && data.errors && data.errors[ 0 ] && data.errors[ 0 ].message ) {
			return data.errors[ 0 ].message;
		}

		if ( data && data.error_data ) {
			const errors = Object.values( data.error_data );

			// Catch RateLimitExceeded specifically.
			if ( errors[ 0 ] && 'RateLimitExceeded' === errors[ 0 ].reason ) {
				return __( 'Too many requests have been sent within a given time span. Please reload this page again in a few seconds.', 'google-site-kit' );
			}
		}

		if ( data && data.errors ) {
			const errors = Object.values( data.errors );
			if ( errors[ 0 ] && errors[ 0 ][ 0 ] ) {
				return errors[ 0 ][ 0 ];
			}
		}

		// If error is the root of the response, ensure all expected parts are
		// present, just to "be sure" that it is an error. All above error
		// handlers are legacy and are likely never hit, but let's keep them
		// because nobody will ever know.
		if ( data.code && data.message && data.data && data.data.status ) {
			return data.message;
		}

		// No error.
		return false;
	}
) => {
	/**
	 * Map of data requests by context.
	 *
	 * @since 1.26.0
	 *
	 * @type {Object.<string, Object[]>}
	 */
	const dataRequestsByContext = selectData.reduce(
		( acc, dataRequest ) => {
			castArray( dataRequest.context ).forEach( ( context ) => {
				acc[ context ] = acc[ context ] || [];
				acc[ context ].push( dataRequest );
			} );
			return acc;
		},
		{}
	);
	// ...and returns another component...
	class NewComponent extends Component {
		constructor( props ) {
			super( props );

			this.state = {
				data: false,
				zeroData: false,
				errorMessage: false,
				moduleRequiringSetup: '',
			};

			this.handleModuleDataReset = this.handleModuleDataReset.bind( this );
			this.handleReturnedData = this.handleReturnedData.bind( this );
			this.addDataRequests = this.addDataRequests.bind( this );
			this.removeDataRequests = this.removeDataRequests.bind( this );
		}

		componentDidMount() {
			addAction(
				'googlesitekit.moduleDataReset',
				'googlesitekit.moduleDataResetHandler',
				this.handleModuleDataReset
			);

			this.addDataRequests();
		}

		componentWillUnmount() {
			removeAction(
				'googlesitekit.moduleDataReset',
				'googlesitekit.moduleDataResetHandler',
				this.handleModuleDataReset
			);

			this.removeDataRequests();
		}

		handleModuleDataReset() {
			// When the global dateRange changes, it will trigger the googlesitekit.moduleDataReset action.
			// When this happens, we need to re-hook the requests for the default date range to be applied correctly.
			this.removeDataRequests();
			this.addDataRequests();

			this.setState( {
				data: false,
				errorMessage: false,
				zeroData: false,
			} );
		}

		addDataRequests() {
			const { dateRange } = this.props;

			Object.entries( dataRequestsByContext ).forEach(
				( [ context, dataRequests ] ) => {
					addFilter(
						`googlesitekit.module${ context }DataRequest`,
						`googlesitekit.withData.${ hashRequests( dataRequests ) }`,
						( contextRequests ) => {
							const modulesData = getModulesData();
							const requestsToAdd = [];
							for ( const dataRequest of dataRequests ) {
								const { type, identifier } = dataRequest || {};
								// If a dataRequest's module requires setup, set it in the state.
								// This will cause the setup incomplete component to be rendered in all cases.
								if ( TYPE_MODULES === type && ! modulesData[ identifier ]?.setupComplete ) {
									this.setState( {
										moduleRequiringSetup: identifier,
										moduleRequiringActivation: ! modulesData[ identifier ]?.active,
									} );
									continue;
								}

								// Apply default date range if not set.
								const request = requestWithDateRange( dataRequest, dateRange );
								request.callback = ( returnedData ) => {
									this.handleReturnedData( returnedData, dataRequest );
								};
								requestsToAdd.push( request );
							}
							return contextRequests.concat( requestsToAdd );
						}
					);
				}
			);
		}

		removeDataRequests() {
			Object.entries( dataRequestsByContext ).forEach(
				( [ context, dataRequests ] ) => {
					removeFilter(
						`googlesitekit.module${ context }DataRequest`,
						`googlesitekit.withData.${ hashRequests( dataRequests ) }`,
					);
				}
			);
		}

		/**
		 * Handles a single datapoint returned from the data API.
		 *
		 * Each resolved data point is passed thru this handler to detect errors and zero data conditions, and
		 * to trigger `handleDataError` and `handleDataSuccess` helpers.
		 *
		 * @since 1.0.0
		 *
		 * @param {Object} returnedData The data returned from the API.
		 * @param {Object} requestData  The data object for the request.
		 */
		handleReturnedData( returnedData, requestData ) {
			// If available, `handleDataError` will be called for errors (with a string) and empty data.
			const {
				handleDataError,
				handleDataSuccess,
			} = this.props;
			const { datapoint, identifier, toState } = requestData;

			// Check to see if the returned data is an error. If so, getDataError will return a string.
			const errorMessage = getDataError( returnedData );
			if ( errorMessage ) {
				// Set an error state on the Component.
				this.setState( {
					errorMessage,
					errorObj: returnedData,
					module: identifier,
				} );

				// If the Component included a `handleDataError` helper, pass it the error message.
				if ( handleDataError ) {
					handleDataError( errorMessage, returnedData );
				}
			} else if ( isDataZero( returnedData, datapoint, requestData ) ) { // No data error, next check for zero data.
				// If we have a `handleDataError` call it without any parameters (indicating empty data).
				if ( handleDataError ) {
					handleDataError( errorMessage, returnedData );
				}

				// Set a zeroData state on the Component.
				this.setState( { zeroData: true } );
			} else if ( handleDataSuccess ) {
				// Success! `handleDataSuccess` will be called (ie. not error or zero).
				handleDataSuccess();
			}

			// Resolve the returned data by setting state on the Component.
			this.setState( {
				requestDataToState: toState,
				data: returnedData,
				datapoint,
				module: identifier,
			} );
		}

		render() {
			const {
				data,
				datapoint,
				module,
				zeroData,
				errorMessage,
				errorObj,
				requestDataToState,
				moduleRequiringSetup,
				moduleRequiringActivation,
			} = this.state;

			if ( moduleRequiringActivation ) {
				return getModuleInactiveComponent( moduleRequiringSetup, layoutOptions.inGrid, layoutOptions.fullWidth, layoutOptions.createGrid );
			}

			if ( moduleRequiringSetup ) {
				return getSetupIncompleteComponent( moduleRequiringSetup, layoutOptions.inGrid, layoutOptions.fullWidth, layoutOptions.createGrid );
			}

			// Render the loading component until we have data.
			if ( ! data ) {
				return loadingComponent;
			}

			// If we have an error, display the DataErrorComponent.
			if ( errorMessage ) {
				return ( 'string' !== typeof errorMessage ) ? errorMessage : getDataErrorComponent( module, errorMessage, layoutOptions.inGrid, layoutOptions.fullWidth, layoutOptions.createGrid, errorObj );
			}

			// If we have zeroData, display the NoDataComponent.
			if ( zeroData ) {
				const moduleName = getModulesData()[ module ]?.name || __( 'Site Kit', 'google-site-kit' );

				return getNoDataComponent( moduleName, layoutOptions.inGrid, layoutOptions.fullWidth, layoutOptions.createGrid );
			}

			// Render the Component when we have data, passing the datapoint.
			return (
				<DataDependentComponent
					data={ data }
					datapoint={ datapoint }
					requestDataToState={ requestDataToState }
					{ ...this.props }
				/>
			);
		}
	}

	const displayName = DataDependentComponent.displayName || DataDependentComponent.name || 'AnonymousComponent';
	NewComponent.displayName = `withData(${ displayName })`;

	return withSelect( ( select ) => {
		return {
			dateRange: select( CORE_USER ).getDateRange(),
			dateRangeLength: select( CORE_USER ).getDateRangeNumberOfDays(),
		};
	} )( NewComponent );
};

export default withData;
