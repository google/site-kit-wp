/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import {
	addAction,
	applyFilters,
	removeAction,
	removeFilter,
	addFilter,
	doAction,
} from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { Option, Select } from '../material-components';
import { getAvailableDateRanges } from '../util/date-range';

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
			dateValue: applyFilters( this.dateRangeHook, 'last-28-days' ),
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
			dateValue: applyFilters( this.dateRangeHook, 'last-28-days' ),
		} );

		return false;
	}

	render() {
		const { dateValue } = this.state;

		return (
			<Select
				enhanced
				className="mdc-select--minimal"
				name="time_period"
				label=""
				onEnhancedChange={ this.handleSelection }
				value={ dateValue }
			>
				{ Object.values( getAvailableDateRanges() ).map( ( { slug, label } ) => (
					<Option key={ slug } value={ slug }>
						{ label }
					</Option>
				) ) }
			</Select>
		);
	}
}

export default DateRangeSelector;
