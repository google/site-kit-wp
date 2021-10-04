/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';

/**
 * External dependencies
 */
import { render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { VIEW_CONTEXT_POSTS_LIST } from './googlesitekit/constants';
import Root from './components/Root';
import { AccessSelector } from './modules/subscribe-with-google/components/posts';

function handleBulkActionSelectorChange( event ) {
	document
		.querySelector( '#posts-filter' )
		.classList.toggle(
			'googlesitekit-swg-access-selector-container-is-visible',
			event.target.value === 'googlesitekit-swg-access'
		);
}

domReady( () => {
	// TODO: Use Sass...
	const style = document.createElement( 'style' );
	style.textContent = `
.googlesitekit-swg-access-selector-container {
	display: none;
}

.googlesitekit-swg-access-selector-container-is-visible
	.googlesitekit-swg-access-selector-container {
	display: initial;
}
`;
	document.body.append( style );

	const bulkActionSelectors = [
		...document.querySelectorAll(
			'#bulk-action-selector-top, #bulk-action-selector-bottom'
		),
	];
	for ( const bulkActionSelector of bulkActionSelectors ) {
		const accessSelectorContainer = document.createElement( 'span' );
		accessSelectorContainer.classList.add(
			'googlesitekit-swg-access-selector-container'
		);
		bulkActionSelector.after( accessSelectorContainer );

		render(
			<Root viewContext={ VIEW_CONTEXT_POSTS_LIST }>
				<AccessSelector />
			</Root>,
			accessSelectorContainer
		);

		bulkActionSelector.addEventListener(
			'change',
			handleBulkActionSelectorChange
		);
	}
} );
