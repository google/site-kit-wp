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
use Google\Site_Kit\Core\Authentication\Connected_Proxy_URL;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Migration_N_E_X_T;
use Google\Site_Kit\Tests\TestCase;

class Migration_N_E_X_TTest extends TestCase {

	protected Context $context;
	protected Options $options;
	protected Connected_Proxy_URL $connected_proxy_url;

	public function set_up() {
		parent::set_up();

		$this->context             = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options             = new Options( $this->context );
		$this->connected_proxy_url = new Connected_Proxy_URL( $this->options );

		// Remove both options from the database, so each test relies only on
		// the values it creates and stores.
		$this->options->delete( Connected_Proxy_URL::OPTION );
		$this->options->delete( Migration_N_E_X_T::DB_VERSION_OPTION );
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

		$this->assertSame(
			0,
			has_action( 'admin_init', array( $migration, 'migrate' ) ),
			'The migration should add `migrate()` to the `admin_init` action at priority 0, ahead of `Authentication::check_connected_proxy_url()` at priority 10.'
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

	public function test_migrate__keeps_an_already_base64_encoded_url() {
		$migration = $this->get_new_migration_instance();

		$this->connected_proxy_url->set( 'https://example.com' );

		$migration->migrate();

		$this->assertSame(
			base64_encode( 'https://example.com/' ),
			$this->options->get( Connected_Proxy_URL::OPTION ),
			'Migration should keep an already encoded value unchanged.'
		);
	}

	public function test_migrate__keeps_a_stored_value_that_does_not_start_with_http() {
		$migration = $this->get_new_migration_instance();

		// Store a value that doesn't start with `http`. The migration skips it,
		// so nothing gets encoded.
		$this->options->set( Connected_Proxy_URL::OPTION, 'not*a*valid*value' );

		$migration->migrate();

		$this->assertSame(
			'not*a*valid*value',
			$this->options->get( Connected_Proxy_URL::OPTION ),
			'Migration should keep a stored value that is not a plain text URL unchanged, rather than encode it as a connected proxy URL.'
		);
	}

	public function test_migrate__skips_when_no_connected_proxy_url_is_stored() {
		$migration = $this->get_new_migration_instance();

		$migration->migrate();

		$this->assertOptionNotExists( Connected_Proxy_URL::OPTION );
	}

	public function test_migrate__sets_db_version() {
		$migration = $this->get_new_migration_instance();

		$migration->migrate();

		$this->assertEquals(
			'n.e.x.t',
			$this->options->get( Migration_N_E_X_T::DB_VERSION_OPTION ),
			"Database version should update to the migration's target version after the migration runs."
		);
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
}
