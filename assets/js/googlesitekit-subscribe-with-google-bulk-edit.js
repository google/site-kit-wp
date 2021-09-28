/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';

/**
 * External dependencies
 */
import { render } from 'react-dom';

/**
 * Internal dependencies
 */
import { VIEW_CONTEXT_POSTS_LIST } from './googlesitekit/constants';
import Root from './components/Root';
import { AccessSelector } from './modules/subscribe-with-google/components/posts';

function renderDropdowns( { selectedOption, hidden } ) {
	const containers = [
		...document.querySelectorAll(
			'.sitekit-swg-access-selector-container'
		),
	];

	for ( const container of containers ) {
		render(
			<Root viewContext={ VIEW_CONTEXT_POSTS_LIST }>
				<AccessSelector
					selectedOption={ selectedOption }
					hidden={ hidden }
					onChange={ handleChange }
				/>
			</Root>,
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
