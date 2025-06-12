const { z } = require( 'zod' );

/**
 * Validation schema for get_github_issue tool arguments.
 *
 * @since n.e.x.t
 */
const GetIssueArgsSchema = {
	issue_number: z
		.number()
		.int()
		.positive()
		.describe( 'The GitHub issue number to fetch' ),
	github_token: z
		.string()
		.optional()
		.describe( 'Optional GitHub API token for higher rate limits' ),
};

module.exports = { GetIssueArgsSchema };
