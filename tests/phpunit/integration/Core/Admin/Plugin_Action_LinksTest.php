<?php
/**
 * Plugin_Action_LinksTest
 *
 * @package   Google\Site_Kit\Tests\Core\Admin
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Admin;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Admin\Plugin_Action_Links;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Admin
 */
class Plugin_Action_LinksTest extends TestCase {
	use Fake_Site_Connection_Trait;

	/**
	 * Context instance.
	 *
	 * @var Context
	 */
	private $context;

	const ACTION_LINKS_FILTER = 'plugin_action_links_' . GOOGLESITEKIT_PLUGIN_BASENAME;

	public function set_up() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$this->context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$plugin_action_links = new Plugin_Action_Links( $this->context );

		remove_all_filters( self::ACTION_LINKS_FILTER );

		$plugin_action_links->register();
	}

	public function test_displays_setup_link_when_plugin_is_not_setup() {
		$action_links = apply_filters( self::ACTION_LINKS_FILTER, array() );

		$this->assertEquals(
			array(
				'<a href="http://example.org/wp-admin/admin.php?page=googlesitekit-dashboard">Start Setup</a>',
			),
			$action_links,
			'The action links array should only contain a link to the Settings page.'
		);
	}

	public function test_displays_settings_link_when_plugin_is_setup() {
		$this->fake_proxy_site_connection();

		add_filter( 'googlesitekit_setup_complete', '__return_true', 100 );

		$authentication = new Authentication( $this->context );
		$authentication->verification()->set( true );
		$authentication->get_oauth_client()->set_token(
			array(
				'access_token' => 'valid-auth-token',
			)
		);

		$action_links = apply_filters( self::ACTION_LINKS_FILTER, array() );

		$this->assertEquals(
			array(
				'<a href="http://example.org/wp-admin/admin.php?page=googlesitekit-settings">Settings</a>',
			),
			$action_links,
			'The action links array should only contain a setup link.'
		);
	}
}
