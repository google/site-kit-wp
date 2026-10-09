<?php
/**
 * Trait Google\Site_Kit\Tests\Authenticated_Search_Console_Trait
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Search_Console;

/**
 * Trait for testing Search Console reports with a fake Search Console API.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
trait Authenticated_Search_Console_Trait {

	/**
	 * Creates a Search Console module for an authenticated administrator, whose
	 * requests the given handler answers.
	 *
	 * The administrator becomes the current user, since the module reads the
	 * token of the current user.
	 *
	 * @since n.e.x.t
	 *
	 * @param callable $handler The handler each request to the Search Console API goes to.
	 * @return Search_Console The module, with no property.
	 */
	protected function create_authenticated_search_console( callable $handler ) {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options        = new Options( $context );
		$user_options   = new User_Options( $context, $user_id );
		$authentication = new Authentication( $context, $options, $user_options );
		$search_console = new Search_Console( $context, $options, $user_options, $authentication );

		$authentication->get_oauth_client()->set_token( array( 'access_token' => 'valid-token' ) );
		$authentication->get_oauth_client()->set_granted_scopes(
			array_merge(
				$authentication->get_oauth_client()->get_required_scopes(),
				$search_console->get_scopes()
			)
		);

		FakeHttp::fake_google_http_handler( $search_console->get_client(), $handler );

		return $search_console;
	}
}
