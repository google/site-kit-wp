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

namespace Google\Service\Webcontentpublisher\Resource;

use Google\Service\Webcontentpublisher\Cta;
use Google\Service\Webcontentpublisher\ListCtasResponse;

/**
 * The "ctas" collection of methods.
 * Typical usage is:
 *  <code>
 *   $webcontentpublisherService = new Google\Service\Webcontentpublisher(...);
 *   $ctas = $webcontentpublisherService->organizations_publications_ctas;
 *  </code>
 */
class OrganizationsPublicationsCtas extends \Google\Service\Resource
{
  /**
   * Creates a CTA. (ctas.create)
   *
   * @param string $parent Required. The parent publication resource where this
   * CTA will be created.
   * @param Cta $postBody
   * @param array $optParams Optional parameters.
   *
   * @opt_param string ctaId The unique identifier of the CTA to create.
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
   * @param string $parent Required. The parent publication resource whose CTAs
   * to list.
   * @param array $optParams Optional parameters.
   *
   * @opt_param int pageSize The maximum number of CTAs to return.
   * @opt_param string pageToken A page token from a previous request.
   * @return ListCtasResponse
   * @throws \Google\Service\Exception
   */
  public function listOrganizationsPublicationsCtas($parent, $optParams = [])
  {
    $params = ['parent' => $parent];
    $params = array_merge($params, $optParams);
    return $this->call('list', [$params], ListCtasResponse::class);
  }
}

class_alias(OrganizationsPublicationsCtas::class, 'Google_Service_Webcontentpublisher_Resource_OrganizationsPublicationsCtas');
