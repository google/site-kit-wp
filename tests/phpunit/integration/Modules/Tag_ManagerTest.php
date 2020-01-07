<?php
/**
 * Tag_ManagerTest
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Tag_Manager;
use Google\Site_Kit\Modules\Tag_Manager\Settings;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Scopes_ContractTests;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 */
class Tag_ManagerTest extends TestCase {
	use Module_With_Scopes_ContractTests;

	public function test_register() {
		$tagmanager = new Tag_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		remove_all_filters( 'googlesitekit_auth_scopes' );

		$tagmanager->register();

		$this->assertEqualSets(
			$tagmanager->get_scopes(),
			apply_filters( 'googlesitekit_auth_scopes', array() )
		);
	}

	public function test_is_connected() {
		$tagmanager = new Tag_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		// is_connected relies on get_data so it isn't currently possible to test a connected state.
		$this->assertFalse( $tagmanager->is_connected() );
	}

	public function test_on_deactivation() {
		$tagmanager = new Tag_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options    = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options->set( Settings::OPTION, 'test-value' );

		$tagmanager->on_deactivation();

		$this->assertOptionNotExists( Settings::OPTION );
	}

	public function test_scopes() {
		$tagmanager = new Tag_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'https://www.googleapis.com/auth/tagmanager.readonly',
				'https://www.googleapis.com/auth/tagmanager.edit.containers',
				'https://www.googleapis.com/auth/tagmanager.manage.accounts',
				'https://www.googleapis.com/auth/tagmanager.manage.users',
			),
			$tagmanager->get_scopes()
		);
	}

	public function test_prepare_info_for_js() {
		$tagmanager = new Tag_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$info = $tagmanager->prepare_info_for_js();

		$this->assertEqualSets(
			array(
				'slug',
				'name',
				'description',
				'cta',
				'sort',
				'homepage',
				'learnMore',
				'group',
				'feature',
				'module_tags',
				'required',
				'autoActivate',
				'internal',
				'screenID',
				'hasSettings',
				'provides',
				'settings',
			),
			array_keys( $info )
		);

		$this->assertEquals( 'tagmanager', $info['slug'] );
		$this->assertArrayHasKey( 'accountID', $info['settings'] );
		$this->assertArrayHasKey( 'containerID', $info['settings'] );
	}

	public function test_get_datapoints() {
		$tagmanager = new Tag_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'connection',
				'account-id',
				'container-id',
				'accounts-containers',
				'containers',
				'settings',
				'tag-permission',
			),
			$tagmanager->get_datapoints()
		);
	}

	public function test_amp_data_load_analytics_component() {
		$tagmanager = new Tag_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$tagmanager->register();

		$data = array( 'amp_component_scripts' => array() );

		$result = apply_filters( 'amp_post_template_data', $data );
		$this->assertSame( $data, $result );

		$tagmanager->set_data( 'container-id', array( 'containerID' => '12345678' ) );

		$result = apply_filters( 'amp_post_template_data', $data );
		$this->assertArrayHasKey( 'amp-analytics', $result['amp_component_scripts'] );
	}

	/**
	 * @param string $input String to sanitize
	 * @param string $expected Expected output
	 * @dataProvider container_name_provider
	 */
	public function test_sanitize_container_name( $input, $expected ) {
		$this->assertEquals(
			$expected,
			Tag_Manager::sanitize_container_name( $input )
		);
	}

	public function container_name_provider() {
		return array(
			array(
				'Example Site Name',
				'Example Site Name',
			),
			array(
				'Exåmplé Sïtē Nàmę',
				'Example Site Name',
			),
			array(
				'_Example_Site_Name_',
				'Example_Site_Name_',
			),
			array(
				'Example Site & Name',
				'Example Site Name',
			),
			array(
				'Example Site &amp; Name',
				'Example Site Name',
			),
			array(
				'Example Site with 🔥 Name',
				'Example Site with Name',
			),
			array(
				'Example Site with "double quotes"',
				'Example Site with double quotes',
			),
			array(
				'Example Site with &quot;double quotes&quot;',
				'Example Site with double quotes',
			),
			array(
				'Example Site with \'single quotes\'',
				'Example Site with single quotes',
			),
			array(
				'Example Site with &#039;single quotes&#039;',
				'Example Site with single quotes',
			),
			array(
				'Example Site with `~!@#$%^&*()_+[]{}\\|;"<>,./?',
				'Example Site with _,.',
			),
		);
	}

	/**
	 * @return Module_With_Scopes
	 */
	protected function get_module_with_scopes() {
		return new Tag_Manager( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}
}
