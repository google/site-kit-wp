<?php
/**
 * \Google\Site_Kit\Tests\Core\Util\Migration_N_E_X_TTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Connected_Proxy_URL;
use Google\Site_Kit\Core\Authentication\Disconnected_Reason;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\Migration_N_E_X_T;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\TestCase;

class Migration_N_E_X_TTest extends TestCase {

	use Fake_Site_Connection_Trait;

	protected Context $context;
	protected Options $options;
	protected Connected_Proxy_URL $connected_proxy_url;

	public function set_up() {
		parent::set_up();

		$this->context             = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options             = new Options( $this->context );
		$this->connected_proxy_url = new Connected_Proxy_URL( $this->options );

		// Drop the option, so each test starts from the value it stores itself.
		$this->options->delete( Connected_Proxy_URL::OPTION );

		$this->delete_db_version();
	}

	public function get_new_migration_instance() {
		return new Migration_N_E_X_T(
			$this->context,
			$this->options
		);
	}

	public function test_register() {
		$migration = $this->get_new_migration_instance();
		remove_all_actions( 'admin_init' );

		$migration->register();

		$this->assertNotFalse(
			has_action( 'admin_init', array( $migration, 'migrate' ) ),
			'Migration should register migrate on admin_init.'
		);
	}

	public function test_migrate__encodes_a_legacy_plain_text_url() {
		$migration = $this->get_new_migration_instance();

		// Store the option in plain text, the way earlier plugin versions saved it.
		$this->options->set( Connected_Proxy_URL::OPTION, 'https://example.com/' );

		$migration->migrate();

		$this->assertEquals(
			base64_encode( 'https://example.com/' ),
			$this->options->get( Connected_Proxy_URL::OPTION ),
			'Migration should store the legacy plain text URL encoded.'
		);
		$this->assertEquals(
			'https://example.com/',
			$this->connected_proxy_url->get(),
			'The `get()` method should still return the plain text URL after the migration.'
		);
	}

	public function test_migrate__keeps_an_already_encoded_url() {
		$migration = $this->get_new_migration_instance();

		$this->connected_proxy_url->set( 'https://example.com' );
		$stored_connected_url = $this->options->get( Connected_Proxy_URL::OPTION );

		$migration->migrate();

		$this->assertSame(
			$stored_connected_url,
			$this->options->get( Connected_Proxy_URL::OPTION ),
			'Migration should keep an already encoded value unchanged.'
		);
	}

	public function test_migrate__runs_before_the_connected_proxy_url_check() {
		remove_all_actions( 'admin_init' );

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$user_options = new User_Options( $this->context );

		// Register in the order the plugin does. The connected proxy URL check
		// runs at a later priority, so the migration encodes the stored value
		// before the check reads it.
		$authentication = new Authentication( $this->context, $this->options, $user_options );
		$authentication->register();
		$this->get_new_migration_instance()->register();

		// Store the home URL in plain text, the way earlier plugin versions saved it.
		$this->options->set( Connected_Proxy_URL::OPTION, $this->context->get_canonical_home_url() );

		// Emulate credentials.
		$this->fake_proxy_site_connection();

		// Emulate OAuth access token.
		$authentication->get_oauth_client()->set_token( array( 'access_token' => 'valid-auth-token' ) );

		// Grant the administrator the Permissions::SETUP capability regardless
		// of authentication.
		add_filter(
			'user_has_cap',
			function ( $caps ) {
				$caps[ Permissions::SETUP ] = true;
				return $caps;
			}
		);

		do_action( 'admin_init' );

		$this->assertEquals(
			base64_encode( trailingslashit( $this->context->get_canonical_home_url() ) ),
			$this->options->get( Connected_Proxy_URL::OPTION ),
			'Migration should encode the plain text URL on admin_init.'
		);
		$this->assertFalse(
			$user_options->get( Disconnected_Reason::OPTION ),
			'Site Kit should stay connected when the migration encodes the URL the site still runs on.'
		);
	}

	public function test_migrate__skips_when_the_option_is_missing() {
		$migration = $this->get_new_migration_instance();

		$migration->migrate();

		$this->assertOptionNotExists( Connected_Proxy_URL::OPTION );
	}

	public function test_migrate__sets_db_version() {
		$migration = $this->get_new_migration_instance();

		$migration->migrate();

		$this->assertEquals( 'n.e.x.t', $this->get_db_version(), "Database version should update to the migration's target version after the migration runs." );
	}

	public function test_migrate__skips_when_the_db_version_is_current() {
		$migration = $this->get_new_migration_instance();

		$this->options->set( Migration_N_E_X_T::DB_VERSION_OPTION, Migration_N_E_X_T::DB_VERSION );

		// Store the option in plain text, the way earlier plugin versions saved it.
		$this->options->set( Connected_Proxy_URL::OPTION, 'https://example.com/' );

		$migration->migrate();

		$this->assertEquals(
			'https://example.com/',
			$this->options->get( Connected_Proxy_URL::OPTION ),
			'Migration should leave the stored value alone when the database version already matches its target.'
		);
	}

	protected function get_db_version() {
		return $this->options->get( Migration_N_E_X_T::DB_VERSION_OPTION );
	}

	protected function delete_db_version() {
		$this->options->delete( Migration_N_E_X_T::DB_VERSION_OPTION );
	}
}
