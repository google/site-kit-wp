/**
 * ESLint rules: Camelcase acronyms.
 */

const { isImported, isFunction } = require( '../utils' );

function shouldIgnore( node, name, acronymMatch, acronym, importedNames ) {
	if ( acronymMatch === acronym ) {
		if ( acronym.length === name.length ) {
			return true;
		}
		if ( ! name.startsWith( acronym ) ) {
			return true;
		}
		if ( isFunction( node ) ) {
			return true;
		}
		if ( name === name.toUpperCase() ) {
			return true;
		}
	}

	if ( acronymMatch === acronym.toLowerCase() ) {
		return true;
	}

	const startsWithUppercase = /^[A-Z]/.test( acronymMatch );
	if ( ! startsWithUppercase ) {
		return true;
	}

	if (
		name.length === acronym.length &&
		( acronymMatch === acronym.toLowerCase() ||
			acronymMatch === acronym.toUpperCase() )
	) {
		return true;
	}

	const index = name.indexOf( acronymMatch );
	const nextChar = name[ index + acronym.length ];
	if ( nextChar && /[a-z]/.test( nextChar ) ) {
		return true;
	}

	return importedNames.includes( name );
}

module.exports = {
	create( context ) {
		const options = context.options[ 0 ] || {};
		let properties = options.properties || '';
		const importedNames = [];

		if ( properties !== 'always' && properties !== 'never' ) {
			properties = 'always';
		}

		const reported = [];
		const acronyms = [
			'AMP',
			'CTA',
			'GA',
			'GTM',
			'HTML',
			'ID',
			'JSON',
			'URL',
		];

		function report( node ) {
			if ( ! reported.includes( node ) ) {
				reported.push( node );
				context.report( {
					data: { name: node.name },
					message: `\`${ node.name }\` violates naming rules.`,
					node,
				} );
			}
		}

		return {
			Identifier( node ) {
				const name = node.name;

				if ( isImported( node ) ) {
					importedNames.push( name );
					return;
				}

				if ( node.parent?.type === 'CallExpression' ) {
					return;
				}

				if (
					node.parent &&
					node.parent.object &&
					( node.parent.object.name === 'document' ||
						node.parent.object.name === 'global' ||
						node.parent.object.name === 'window' ||
						( node.parent.object.object &&
							[ 'document', 'global', 'window' ].includes(
								node.parent.object.object.name
							) ) )
				) {
					return;
				}

				for ( const acronym of acronyms ) {
					const acronymMatches = name.match(
						new RegExp( acronym, 'i' )
					);
					if ( ! acronymMatches ) {
						continue;
					}

					const acronymMatch = acronymMatches[ 0 ];

					if (
						shouldIgnore(
							node,
							name,
							acronymMatch,
							acronym,
							importedNames
						)
					) {
						continue;
					}

					report( node );
				}
			},
		};
	},
};
