import { render } from 'react-dom';
import domReady from '@wordpress/dom-ready';

function renderDropdowns( { selectedOption, hidden } ) {
	const containers = [
		...document.querySelectorAll(
			'.sitekit-swg-access-selector-container'
		),
	];

	// TODO: Load from DB.
	const options = [ 'openaccess', 'basic', 'premium' ];

	for ( const container of containers ) {
		render(
			<AccessSelector
				selectedOption={ selectedOption }
				options={ options }
				hidden={ hidden }
			/>,
			container
		);
	}
}

domReady( () => {
	const bulkActionSelectors = [
		...document.querySelectorAll(
			'#bulk-action-selector-top, #bulk-action-selector-bottom'
		),
	];
	for ( const bulkActionSelector of bulkActionSelectors ) {
		const accessSelectorContainer = document.createElement( 'span' );
		accessSelectorContainer.classList.add(
			'sitekit-swg-access-selector-container'
		);
		bulkActionSelector.after( accessSelectorContainer );

		bulkActionSelector.addEventListener(
			'change',
			handleBulkActionSelectorChange
		);
	}
} );

function handleBulkActionSelectorChange( e ) {
	const hidden = e.target.value !== 'sitekit-swg-access';
	renderDropdowns( { hidden } );
}

function handleChange( { target: { value } } ) {
	renderDropdowns( { selectedOption: value } );
}

function AccessSelector( { options = [], selectedOption, hidden } ) {
	if ( hidden ) {
		return null;
	}

	const optionElements = options.map( ( option ) => (
		<option key={ option } value={ option }>
			{ option === 'openaccess' ? '— Free —' : option }
		</option>
	) );

	return (
		<select
			value={ selectedOption }
			name="sitekit-swg-access-selector"
			className="sitekit-swg-access-selector"
			onBlur={ () => {
				// Satisfies a deprecated check
				// https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/master/docs/rules/no-onchange.md
			} }
			onChange={ handleChange }
		>
			{ optionElements }
		</select>
	);
}
