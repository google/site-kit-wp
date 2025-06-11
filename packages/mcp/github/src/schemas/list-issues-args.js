const { z } = require( 'zod' );

/**
 * Validation schema for list_github_issues tool arguments.
 *
 * @since n.e.x.t
 */
const ListIssuesArgsSchema = z.object( {
	state: z
		.enum( [ 'open', 'closed', 'all' ] )
		.default( 'open' )
		.describe( 'Issue state filter' ),
	labels: z
		.string()
		.default( '' )
		.describe( 'Comma-separated list of label names to filter by' ),
	sort: z
		.enum( [ 'created', 'updated', 'comments' ] )
		.default( 'created' )
		.describe( 'Sort issues by' ),
	direction: z
		.enum( [ 'asc', 'desc' ] )
		.default( 'desc' )
		.describe( 'Sort direction' ),
	per_page: z
		.number()
		.int()
		.min( 1 )
		.max( 100 )
		.default( 30 )
		.describe( 'Number of issues per page' ),
	page: z.number().int().min( 1 ).default( 1 ).describe( 'Page number' ),
	github_token: z
		.string()
		.optional()
		.describe( 'Optional GitHub API token for higher rate limits' ),
} );

module.exports = { ListIssuesArgsSchema };
