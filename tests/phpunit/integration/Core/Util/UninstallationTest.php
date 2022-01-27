<?php
/**
 * UninstallationTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Uninstallation;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use WP_Error;

/**
 * @group Util
 */
class UninstallationTest extends TestCase {
	use Fake_Site_Connection_Trait;

	private $google_proxy;
	private $uninstallation;
	private $issued_delete_site_request;

	public function set_up() {
		parent::set_up();

		$context              = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->google_proxy   = new Google_Proxy( $context );
		$this->uninstallation = new Uninstallation( $context );

		$this->issued_delete_site_request = false;
	}

	public function test_register() {
		remove_all_actions( 'googlesitekit_uninstallation' );
		$this->uninstallation->register();
		$this->assertTrue( has_action( 'googlesitekit_uninstallation' ) );
	}

	public function test_uninstall_using_proxy() {
		remove_all_actions( 'googlesitekit_uninstallation' );
		$this->uninstallation->register();

		$this->fake_proxy_site_connection();
		add_filter( 'pre_http_request', array( $this, 'check_proxy_delete_site_url' ), 10, 3 );
		do_action( 'googlesitekit_uninstallation' );

		// Assert HTTP request to proxy was made.
		$this->assertTrue( $this->issued_delete_site_request );
	}

	public function test_uninstall_not_using_proxy() {
		remove_all_actions( 'googlesitekit_uninstallation' );
		$this->uninstallation->register();

		$this->fake_site_connection();
		add_filter( 'pre_http_request', array( $this, 'check_proxy_delete_site_url' ), 10, 3 );
		do_action( 'googlesitekit_uninstallation' );

		// Assert no HTTP request was made.
		$this->assertFalse( $this->issued_delete_site_request );
	}

	public function check_proxy_delete_site_url( $preempt, $args, $url ) {
		if ( $this->google_proxy->url( Google_Proxy::OAUTH2_DELETE_SITE_URI ) === $url ) {
			$this->issued_delete_site_request = true;
		}
		return $preempt;
	}
}
