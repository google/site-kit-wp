<?php

namespace Google\Site_Kit\Core\CLI;

use Exception;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\CLI\Traits\CLI_Auth;
use Google\Site_Kit_Dependencies\Google\Service\SiteVerification;
use Google\Site_Kit_Dependencies\Google\Service\SiteVerification\SiteVerificationWebResourceResource;
use Google\Site_Kit_Dependencies\Google_Service_Exception;
use WP_CLI;
use WP_CLI\ExitException;
use function WP_CLI\Utils\get_flag_value;

/**
 * Manages site verifications.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Site_Verification_CLI_Command extends CLI_Command {
	use CLI_Auth;

	/**
	 * Lists all Site Verifications for a user.
	 *
	 * ## OPTIONS
	 *
	 * [<glob>]
	 * : Glob to filter by for site identifier. Includes all by default.
	 *
	 * [--type=<level>]
	 * : Verification type to filter by. Defaults to all.
	 * ---
	 * default: all
	 * options:
	 *   - all
	 *   - site
	 *   - domain
	 *
	 * @subcommand list
	 */
	public function _list( $args, $assoc_args ) {
		$this->require_auth_or_fail();

		$glob          = reset( $args );
		$verifications = $this->get_all( $glob, $assoc_args );

		$items = array_map(
			function ( SiteVerificationWebResourceResource $verification ) {
				return $verification->getSite();
			},
			$verifications
		);

		$formatter = new WP_CLI\Formatter( $assoc_args, array( 'type', 'identifier' ) );
		$formatter->display_items( $items );
	}

	/**
	 * Deletes Site Verifications.
	 *
	 * [<glob>]
	 * : Glob to filter by for site identifier. Includes all by default.
	 *
	 * [--type=<level>]
	 * : Verification type to filter by. Defaults to all.
	 * ---
	 * default: all
	 * options:
	 *   - all
	 *   - site
	 *   - domain
	 *
	 * [--yes]
	 * : Pre-confirms the prompt to delete. Use carefully.
	 *
	 * @param $args
	 * @param $assoc_args
	 */
	public function delete( $args, $assoc_args ) {
		$this->require_auth_or_fail();

		$glob  = reset( $args );
		$verifications = $this->get_all( $glob, $assoc_args );

		if ( ! $verifications ) {
			WP_CLI::line( 'No verifications were found to delete.' );
			return;
		}

		WP_CLI::line( 'The following verifications are about to be deleted:' );

		foreach ( $verifications as $verification ) {
			WP_CLI::line( $verification->getSite()->getIdentifier() );
		}

		try {
			if ( ! get_flag_value( $assoc_args, 'yes' ) ) {
				$this->confirm( 'Are you sure?' );
			}
			$this->delete_verifications( $verifications );
		} catch ( ExitException $exception ) {
			WP_CLI::line( 'No verifications were deleted.' );
		} catch ( Exception $exception ) {
			WP_CLI::error( $exception );
		}
	}

	/**
	 * @param SiteVerificationWebResourceResource[] $verifications
	 */
	protected function delete_verifications( array $verifications ) {
		$verifications_resource = $this->get_service()->webResource;

		foreach ( $verifications as $verification ) {
			$verification_id = $verification->getSite()->getIdentifier();

			try {
				$verifications_resource->delete( $verification_id );
				WP_CLI::success( "Deleted verification: $verification_id" );
			} catch ( Google_Service_Exception $e ) {
				WP_CLI::line( "Failed to delete verification: $verification_id" );
				$errors = $e->getErrors();
				$error_msg = isset( $errors[0]['message'] ) ? $errors[0]['message'] : $e->getMessage();
				WP_CLI::warning( $error_msg );
			}
		}
	}

	/**
	 * @return SiteVerificationWebResourceResource[]
	 */
	protected function get_all( $glob, $assoc_args ) {
		$verifications = $this->get_service()->webResource->listWebResource()->getItems();
		$type = get_flag_value( $assoc_args, 'type' );

		if ( $glob ) {
			$verifications = $this->filter_verifications_by_glob( $verifications, $glob );
		}

		if ( $type ) {
			$verifications = $this->filter_verifications_by_type( $verifications, $type );
		}

		usort(
			$verifications,
			function ( SiteVerificationWebResourceResource $a, SiteVerificationWebResourceResource $b ) {
				// Sort naturally using the reversed site URL/domain to group properties and subdomains.
				// This keeps www/non-www and http(s) variants together in the results.
				return strcmp(
					strrev( $a->getSite()->getIdentifier() ),
					strrev( $b->getSite()->getIdentifier() )
				);
			}
		);

		return $verifications;
	}

	/**
	 * @param SiteVerificationWebResourceResource[] $verifications
	 * @param string $glob
	 *
	 * @return array
	 */
	protected function filter_verifications_by_glob( array $verifications, $glob ) {
		return array_filter(
			$verifications,
			function ( SiteVerificationWebResourceResource $resource ) use ( $glob ) {
				return fnmatch( $glob, $resource->getSite()->getIdentifier() );
			}
		);
	}

	/**
	 * @param SiteVerificationWebResourceResource[] $verifications
	 * @param string $type
	 * @return SiteVerificationWebResourceResource[]
	 */
	protected function filter_verifications_by_type( array $verifications, $type ) {
		if ( ! $type || $type === 'all' ) {
			return $verifications;
		}
		$type_site_type_map = array(
			'site'   => 'SITE',
			'domain' => 'INET_DOMAIN',
		);
		$site_type = $type_site_type_map[$type];

		return array_filter(
			$verifications,
			function ( SiteVerificationWebResourceResource $resource ) use ( $site_type ) {
				return $site_type === $resource->getSite()->getType();
			}
		);
	}

	/**
	 * Gets the Site Verification API service instance.
	 *
	 * @return SiteVerification
	 */
	protected function get_service() {
		$authentication = new Authentication( $this->context );

		return new SiteVerification( $authentication->get_oauth_client()->get_client() );
	}
}
