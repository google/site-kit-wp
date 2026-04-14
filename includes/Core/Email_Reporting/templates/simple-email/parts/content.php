<?php
/**
 * Content section for the simple-email template.
 *
 * Renders the main card with configurable graphic position (top-center,
 * top-left, or bottom-center), site domain, title, body paragraphs,
 * optional learn more link, and optional CTA button.
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * @var string   $site_domain        The site domain.
 * @var string   $site_url           The full site URL with protocol.
 * @var string   $title              The email title.
 * @var array    $body               Body paragraphs (may contain HTML).
 * @var array    $cta                Primary CTA configuration with 'url' and 'label'.
 * @var array    $graphic            Graphic configuration with 'slug', 'position', 'width', 'height', 'title_escape'.
 * @var string   $learn_more_url     URL for the learn more link (optional).
 * @var callable $get_asset_url      Function to generate asset URLs.
 * @var callable $render_shared_part Function to render a shared part by name.
 */

$graphic_slug     = $graphic['slug'] ?? '';
$graphic_position = $graphic['position'] ?? 'top-center';
$graphic_width    = $graphic['width'] ?? 0;
$graphic_height   = $graphic['height'] ?? 0;
$title_escape     = $graphic['title_escape'] ?? 'esc_html';
$graphic_url      = ! empty( $graphic_slug ) ? $get_asset_url( $graphic_slug ) : '';

$has_bottom_graphic = ! empty( $graphic_url ) && 'bottom-center' === $graphic_position;
$card_bottom_pad    = $has_bottom_graphic ? '0' : '12px';
?>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
	<tr>
		<td class="card" style="background-color: #FFFFFF; border-radius: 16px; padding: 24px 16px <?php echo esc_attr( $card_bottom_pad ); ?> 16px;">
			<?php /* Graphic at top (top-center or top-left). */ ?>
			<?php if ( ! empty( $graphic_url ) && in_array( $graphic_position, array( 'top-center', 'top-left' ), true ) ) : ?>
			<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
				<tr>
					<td align="<?php echo 'top-center' === $graphic_position ? 'center' : 'left'; ?>" style="padding-bottom: 16px;">
						<img src="<?php echo esc_url( $graphic_url ); ?>" alt="" width="<?php echo (int) $graphic_width; ?>" height="<?php echo (int) $graphic_height; ?>" style="display: block;<?php echo $graphic_width > 100 ? ' max-width: 100%; height: auto;' : ''; ?>" />
					</td>
				</tr>
			</table>
			<?php endif; ?>

			<?php /* Site domain. */ ?>
			<p style="font-size: 14px; line-height: 20px; font-weight: 400; color: #6C726E; margin: 0 0 8px 0;">
				<a class="text-secondary" href="<?php echo esc_url( $site_url ); ?>" style="color: #6C726E; text-decoration: none;"><?php echo esc_html( $site_domain ); ?></a>
			</p>

			<?php /* Title - raw echo for pre-escaped HTML (e.g. invitation mailto), esc_html for others. */ ?>
			<h1 class="text-primary" style="font-size: 16px; line-height: 24px; font-weight: 500; color: #161B18; margin: 0 0 16px 0;">
				<?php
				if ( 'raw' === $title_escape ) {
					// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Contains pre-escaped mailto link.
					echo $title;
				} else {
					echo esc_html( $title );
				}
				?>
			</h1>

			<?php
			/*
			 * Body paragraphs from Content_Map.
			 * Uses wp_kses() for all templates to safely render inline HTML
			 * (e.g. strong tags in subscription-confirmation, anchor tags in error-email).
			 * Plain text body content passes through wp_kses() unchanged.
			 */
			?>
			<?php foreach ( $body as $index => $paragraph ) : ?>
			<p class="text-primary" style="font-size: 14px; line-height: 20px; font-weight: 400; color: #161B18; margin: 0 0 <?php echo $has_bottom_graphic && count( $body ) - 1 === $index ? '20px' : '16px'; ?> 0;">
				<?php
				echo wp_kses(
					$paragraph,
					array(
						'strong' => array(),
						'a'      => array(
							'class' => array(),
							'href'  => array(),
							'style' => array(),
						),
					)
				);
				?>
				<?php if ( 0 === $index && ! empty( $learn_more_url ) ) : ?>
				<a class="link" href="<?php echo esc_url( $learn_more_url ); ?>" style="color: #108080; text-decoration: none;" target="_blank" rel="noopener"><?php echo esc_html__( 'Learn more', 'google-site-kit' ); ?></a>
				<?php endif; ?>
			</p>
			<?php endforeach; ?>

			<?php /* CTA Button (conditionally rendered). */ ?>
			<?php if ( ! empty( $cta['url'] ) ) : ?>
			<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top: 4px;<?php echo $has_bottom_graphic ? ' margin-bottom: 12px;' : ''; ?>">
				<tr>
					<td>
						<?php
						$render_shared_part(
							'dashboard-link',
							array(
								'url'   => $cta['url'],
								'label' => isset( $cta['label'] ) ? $cta['label'] : __( 'Get your report', 'google-site-kit' ),
							)
						);
						?>
					</td>
				</tr>
			</table>
			<?php endif; ?>

			<?php /* Graphic at bottom (bottom-center). */ ?>
			<?php if ( $has_bottom_graphic ) : ?>
			<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
				<tr>
					<td align="center" style="height: <?php echo (int) $graphic_height; ?>px;">
						<img src="<?php echo esc_url( $graphic_url ); ?>" alt="" width="<?php echo (int) $graphic_width; ?>" height="<?php echo (int) $graphic_height; ?>" style="display: block; max-width: 100%; height: auto;" />
					</td>
				</tr>
			</table>
			<?php endif; ?>
		</td>
	</tr>
</table>
