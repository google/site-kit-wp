<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service\WebContentPublisher\Resource;

use Google\Service\WebContentPublisher\Cta;
use Google\Service\WebContentPublisher\ListCtasResponse;

/**
 * The "ctas" collection of methods.
 * Typical usage is:
 *  <code>
 *   $webcontentpublisherService = new Google\Service\WebContentPublisher(...);
 *   $ctas = $webcontentpublisherService->organizations_publications_ctas;
 *  </code>
 */
class OrganizationsPublicationsCtas extends \Google\Service\Resource
{
  /**
   * Creates a CTA. (ctas.create)
   *
   * @param string $parent Required. The parent publication resource where this
   * CTA will be created. Format:
   * `organizations/{organization}/publications/{publication}`.
   * @param Cta $postBody
   * @param array $optParams Optional parameters.
   *
   * @opt_param string ctaId Optional. The unique identifier of the CTA to create.
   * If not specified, the server will generate a random CTA ID.
   * @return Cta
   * @throws \Google\Service\Exception
   */
  public function create($parent, Cta $postBody, $optParams = [])
  {
    $params = ['parent' => $parent, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('create', [$params], Cta::class);
  }
  /**
   * Gets a CTA. (ctas.get)
   *
   * @param string $name Required. The resource name of the CTA to retrieve.
   * Format: `organizations/{organization}/publications/{publication}/ctas/{cta}`.
   * @param array $optParams Optional parameters.
   * @return Cta
   * @throws \Google\Service\Exception
   */
  public function get($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('get', [$params], Cta::class);
  }
  /**
   * Lists CTAs. (ctas.listOrganizationsPublicationsCtas)
   *
   * @param string $parent Required. The parent publication resource whose CTAs to
   * list. Format: `organizations/{organization}/publications/{publication}`.
   * @param array $optParams Optional parameters.
   *
   * @opt_param int pageSize Optional. The maximum number of CTAs to return. The
   * service may return fewer than this value. If unspecified, at most 50 CTAs
   * will be returned.
   * @opt_param string pageToken Optional. A page token, received from a previous
   * `ListCtas` call, to retrieve the next page.
   * @return ListCtasResponse
   * @throws \Google\Service\Exception
   */
  public function listOrganizationsPublicationsCtas($parent, $optParams = [])
  {
    $params = ['parent' => $parent];
    $params = array_merge($params, $optParams);
    return $this->call('list', [$params], ListCtasResponse::class);
  }
  /**
   * Updates a CTA. (ctas.patch)
   *
   * @param string $name Identifier. The resource name of the Cta. Format:
   * organizations/{organization}/publications/{publication}/ctas/{cta}
   * @param Cta $postBody
   * @param array $optParams Optional parameters.
   *
   * @opt_param string updateMask Optional. The list of fields to update.
   * @return Cta
   * @throws \Google\Service\Exception
   */
  public function patch($name, Cta $postBody, $optParams = [])
  {
    $params = ['name' => $name, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('patch', [$params], Cta::class);
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(OrganizationsPublicationsCtas::class, 'Google_Service_WebContentPublisher_Resource_OrganizationsPublicationsCtas');
