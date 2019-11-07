/**
 * External dependencies
 */
import { Select } from 'SiteKitCore/material-components';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import {
	applyFilters,
	addAction,
	removeAction,
	removeFilter,
	addFilter,
	doAction,
} from '@wordpress/hooks';

class DateRangeSelector extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			context: 'Dashboard',
		};

		// The date range is a filtered value.
		this.dateRangeHook = 'googlesitekit.dateRange';

		// The date range is altered when the selection changes with this hook.
		this.dateRangeHandlerHook = 'googlesitekit.dateRageHandler';

		// This hook is used to capture filter changes, forcing a component re-render.
		this.dateRangeHookAddedHook = 'googlesitekit.dateRageHookAddedHandler';

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
		return false;
	}

	render() {
		const options = [
			__( 'Last 7 days', 'google-site-kit' ),
			__( 'Last 14 days', 'google-site-kit' ),
			__( 'Last 28 days', 'google-site-kit' ),
			__( 'Last 90 days', 'google-site-kit' ),
		];

		return (
			<Select
				enhanced
				className="mdc-select--minimal"
				name="time_period"
				label=""
				onEnhancedChange={ this.handleSelection }
				options={ options }
				value={ applyFilters( this.dateRangeHook, __( 'Last 28 days', 'google-site-kit' ) ) }
			/>
		);
	}
}

export default DateRangeSelector;
