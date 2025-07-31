import { sprintf, __ } from '@wordpress/i18n';

/**
 * Computes the aria-label for the Recover CTA button.
 *
 * @since n.e.x.t
 *
 * @param {Object}        args                               Parameters object.
 * @param {Object}        args.recoverableModules            Map of module slugs to module objects.
 * @param {Array<string>} args.userRecoverableModuleSlugs    List of slugs the user can recover.
 * @param {Array<string>} args.selectedModuleSlugs           List of selected slugs for recovery.
 * @param {boolean}       args.hasUserRecoverableModules     Whether the user has recoverable modules.
 * @param {boolean}       args.hasMultipleRecoverableModules Whether there are multiple recoverable modules.
 * @return {string|undefined} Formatted aria-label string, or undefined if no label should be rendered.
 */
export function computeAriaLabel( {
	recoverableModules,
	userRecoverableModuleSlugs,
	selectedModuleSlugs,
	hasUserRecoverableModules,
	hasMultipleRecoverableModules,
} ) {
	if ( ! hasUserRecoverableModules ) {
		return undefined;
	}

	// Early return for single module case.
	if ( ! hasMultipleRecoverableModules ) {
		const moduleName =
			recoverableModules[ userRecoverableModuleSlugs[ 0 ] ]?.name;

		/* translators: %s: Module name. */
		return sprintf( __( 'Recover %s', 'google-site-kit' ), moduleName );
	}

	// Handle multiple modules case (module 1 and module 2, or module 1, module 2... and module X).
	if ( ! selectedModuleSlugs?.length ) {
		return undefined;
	}

	const selectedSet = new Set( selectedModuleSlugs );

	const moduleNames = [];
	for ( const slug of userRecoverableModuleSlugs ) {
		if ( selectedSet.has( slug ) ) {
			const moduleName = recoverableModules[ slug ]?.name;
			if ( moduleName ) {
				moduleNames.push( moduleName );
			}
		}
	}

	if ( moduleNames.length === 0 ) {
		return undefined;
	}

	if ( moduleNames.length === 1 ) {
		return sprintf(
			/* translators: %s: Module name. */
			__( 'Recover %s', 'google-site-kit' ),
			moduleNames[ 0 ]
		);
	}

	if ( moduleNames.length === 2 ) {
		return sprintf(
			/* translators: 1: First module name. 2: Second module name. */
			__( 'Recover %1$s and %2$s', 'google-site-kit' ),
			moduleNames[ 0 ],
			moduleNames[ 1 ]
		);
	}

	const last = moduleNames[ moduleNames.length - 1 ];
	const rest = moduleNames.slice( 0, -1 );

	return sprintf(
		/* translators: 1: List of module names. 2: Last module name. */
		__( 'Recover %1$s and %2$s', 'google-site-kit' ),
		rest.join( ', ' ),
		last
	);
}
