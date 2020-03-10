/**
 * External dependencies
 */
import { Option, Select } from 'SiteKitCore/material-components';

/**
 * WordPress dependencies
 */
import { _n, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import {
	addAction,
	applyFilters,
	removeAction,
	removeFilter,
	addFilter,
	doAction,
} from '@wordpress/hooks';

class DateRangeSelector extends Component {
	constructor( props ) {
		super( props );

		// The date range is a filtered value.
		this.dateRangeHook = 'googlesitekit.dateRange';

		// The date range is altered when the selection changes with this hook.
		this.dateRangeHandlerHook = 'googlesitekit.dateRageHandler';

		// This hook is used to capture filter changes, forcing a component re-render.
		this.dateRangeHookAddedHook = 'googlesitekit.dateRageHookAddedHandler';

		this.state = {
			context: 'Dashboard',
			dateValue: applyFilters( this.dateRangeHook, 28 ),
		};

		// Store the current context when the screen loads, so we can reuse it later.
		addAction(
			'googlesitekit.moduleLoaded',
			'googlesitekit.collectModuleListingDataForDateRangeSelector',
			( context ) => {
				this.setState( { context } );
				removeAction(
					'googlesitekit.moduleLoaded',
					'googlesitekit.collectModuleListingDataForDateRangeSelector'
				);
			}
		);

		this.handleSelection = this.handleSelection.bind( this );
	}

	componentDidMount() {
		addAction(
			'hookAdded',
			this.dateRangeHookAddedHook,
			( slug ) => {
				if ( this.dateRangeHook === slug ) {
					this.forceUpdate();
				}
			}
		);
	}

	componentWillUnmount() {
		removeAction(
			'hookAdded',
			this.dateRangeHookAddedHook,
		);
	}

	handleSelection( index, item ) {
		const { context } = this.state;
		const value = item.getAttribute( 'data-value' );

		removeFilter( this.dateRangeHook, this.dateRangeHandlerHook );
		addFilter(
			this.dateRangeHook,
			this.dateRangeHandlerHook,
			() => {
				return value;
			}
		);

		// Trigger a data refresh.
		doAction( 'googlesitekit.moduleDataReset' );
		doAction( 'googlesitekit.moduleLoaded', context );

		// Update this component.
		this.setState( {
			dateValue: applyFilters( this.dateRangeHook, 28 ),
		} );

		return false;
	}

	render() {
		const { dateValue } = this.state;
		const options = {
			7: sprintf( _n( 'Last %d day', 'Last %d days', 7, 'google-site-kit' ), 7 ),
			14: sprintf( _n( 'Last %d day', 'Last %d days', 14, 'google-site-kit' ), 14 ),
			28: sprintf( _n( 'Last %d day', 'Last %d days', 28, 'google-site-kit' ), 28 ),
			90: sprintf( _n( 'Last %d day', 'Last %d days', 90, 'google-site-kit' ), 90 ),
		};

		return (
			<Select
				enhanced
				className="mdc-select--minimal"
				name="time_period"
				label=""
				onEnhancedChange={ this.handleSelection }
				value={ `${ dateValue }` }
			>
				{ Object.keys( options ).map( ( option ) => {
					return (
						<Option key={ option } value={ option }>
							{ options[ option ] }
						</Option>
					);
				} ) }
			</Select>
		);
	}
}

export default DateRangeSelector;
