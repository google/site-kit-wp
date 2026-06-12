<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Get_Form_MetadataTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Get_Form_Metadata;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Get_Form_MetadataTest extends TestCase {

	/**
	 * Get_Form_Metadata datapoint instance.
	 *
	 * @var Get_Form_Metadata
	 */
	private $datapoint;

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		// Mirror how WPForms registers its CPT in production: non-public, with a
		// custom capability type (whose capabilities are granted to no one) and
		// `map_meta_cap` disabled. Title resolution must not depend on post
		// capabilities, or it would fail for every real form plugin.
		register_post_type(
			'wpforms',
			array(
				'public'          => false,
				'capability_type' => 'wpforms_form',
				'map_meta_cap'    => false,
			)
		);

		$this->datapoint = new Get_Form_Metadata( array( 'service' => '' ) );
	}

	public function tear_down() {
		unregister_post_type( 'wpforms' );
		parent::tear_down();
	}

	private function data_request( array $form_ids ) {
		return new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'form-metadata',
			array( 'formIDs' => $form_ids )
		);
	}

	public function test_create_request__returns_metadata_with_plugin_for_known_post_type() {
		$form_id = self::factory()->post->create(
			array(
				'post_title' => 'Contact',
				'post_type'  => 'wpforms',
			)
		);

		$request = $this->datapoint->create_request( $this->data_request( array( $form_id ) ) );

		$this->assertSame(
			array(
				$form_id => array(
					'title'  => 'Contact',
					'plugin' => 'WPForms',
				),
			),
			$request(),
			'A known form CPT should resolve its title and plugin name.'
		);
	}

	public function test_create_request__does_not_disclose_non_form_post_titles() {
		// A non-form post type (e.g. a regular page/post) must not have its title
		// echoed back — only known form CPTs resolve a title.
		$form_id = self::factory()->post->create( array( 'post_title' => 'Some private page' ) );

		$request = $this->datapoint->create_request( $this->data_request( array( $form_id ) ) );

		$result = $request();
		$this->assertNull(
			$result[ $form_id ]['title'],
			'A non-form post type must not have its title disclosed.'
		);
		$this->assertNull(
			$result[ $form_id ]['plugin'],
			'A non-form post type should resolve no plugin name.'
		);
	}

	public function test_create_request__does_not_disclose_unpublished_form_title() {
		$form_id = self::factory()->post->create(
			array(
				'post_title'  => 'Secret form',
				'post_type'   => 'wpforms',
				'post_status' => 'private',
			)
		);

		$request = $this->datapoint->create_request( $this->data_request( array( $form_id ) ) );

		// Only published forms resolve a title; private/draft/trashed don't.
		$this->assertNull(
			$request()[ $form_id ]['title'],
			'An unpublished form title must not be disclosed.'
		);
	}

	public function test_create_request__returns_null_title_for_missing_post() {
		$missing_id = 99999;

		$request = $this->datapoint->create_request( $this->data_request( array( $missing_id ) ) );

		$this->assertSame(
			array(
				$missing_id => array(
					'title'  => null,
					'plugin' => null,
				),
			),
			$request(),
			'A missing post should resolve null metadata under its requested ID.'
		);
	}

	public function test_create_request__returns_error_when_form_ids_not_array() {
		$data_request = new Data_Request(
			'GET',
			'modules',
			'analytics-4',
			'form-metadata',
			array( 'formIDs' => 'not-an-array' )
		);

		$result = $this->datapoint->create_request( $data_request );

		$this->assertWPError( $result );
		$this->assertSame(
			'missing_required_param',
			$result->get_error_code(),
			'A non-array formIDs parameter should return the missing parameter error.'
		);
	}

	public function test_create_request__drops_non_integer_ids() {
		$form_id = self::factory()->post->create( array( 'post_title' => 'Real form' ) );

		$request = $this->datapoint->create_request(
			$this->data_request( array( $form_id, 0, 'abc' ) )
		);

		$this->assertSame(
			array( $form_id ),
			array_keys( $request() ),
			'Non positive-integer form IDs should be dropped from the result.'
		);
	}

	public function test_is_shareable() {
		// Shareable so shared-dashboard viewers (view-only users) pass base-scope
		// validation and can read the breakdown tab labels.
		$this->assertTrue(
			$this->datapoint->is_shareable(),
			'The datapoint should be shareable for view-only dashboard users.'
		);
	}

	public function test_permission_callback() {
		// Non-sensitive site config shown with the breakdown, so it gates on
		// dashboard access rather than manage_options.
		$this->assertSame(
			current_user_can( Permissions::VIEW_DASHBOARD ),
			$this->datapoint->permission_callback(),
			'The datapoint permission should gate on the VIEW_DASHBOARD capability.'
		);
	}

	public function test_parse_response() {
		$test_data = array( 1 => array( 'title' => 'Contact' ) );

		$this->assertSame(
			$test_data,
			$this->datapoint->parse_response( $test_data, $this->data_request( array( 1 ) ) ),
			'The response should pass through without modification.'
		);
	}
}
