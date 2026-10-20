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

use Google\Service\WebContentPublisher\ListPublicationsResponse;
use Google\Service\WebContentPublisher\Publication;

/**
 * The "publications" collection of methods.
 * Typical usage is:
 *  <code>
 *   $webcontentpublisherService = new Google\Service\WebContentPublisher(...);
 *   $publications = $webcontentpublisherService->organizations_publications;
 *  </code>
 */
class OrganizationsPublications extends \Google\Service\Resource
{
  /**
   * Creates a publication. (publications.create)
   *
   * @param string $parent Required. The parent resource where this publication
   * will be created. Format: `organizations/{organization}`.
   * @param Publication $postBody
   * @param array $optParams Optional parameters.
   *
   * @opt_param string publicationId Optional. The unique identifier of the
   * publication to create. If not specified, the server will generate a random
   * publication ID.
   * @return Publication
   * @throws \Google\Service\Exception
   */
  public function create($parent, Publication $postBody, $optParams = [])
  {
    $params = ['parent' => $parent, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('create', [$params], Publication::class);
  }
  /**
   * Gets a publication. (publications.get)
   *
   * @param string $name Required. The resource name of the publication to
   * retrieve. Format: `organizations/{organization}/publications/{publication}`.
   * @param array $optParams Optional parameters.
   * @return Publication
   * @throws \Google\Service\Exception
   */
  public function get($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('get', [$params], Publication::class);
  }
  /**
   * Lists publications. (publications.listOrganizationsPublications)
   *
   * @param string $parent Required. The parent organization whose publications to
   * list. Format: `organizations/{organization}`.
   * @param array $optParams Optional parameters.
   *
   * @opt_param string filter Optional. A filter expression to filter the
   * publications returned.
   * @opt_param int pageSize Optional. The maximum number of publications to
   * return. The service may return fewer than this value. If unspecified, at most
   * 50 publications will be returned.
   * @opt_param string pageToken Optional. A page token, received from a previous
   * `ListPublications` call, to retrieve the next page.
   * @return ListPublicationsResponse
   * @throws \Google\Service\Exception
   */
  public function listOrganizationsPublications($parent, $optParams = [])
  {
    $params = ['parent' => $parent];
    $params = array_merge($params, $optParams);
    return $this->call('list', [$params], ListPublicationsResponse::class);
  }
  /**
   * Updates a publication. (publications.patch)
   *
   * @param string $name Identifier. The resource name of the publication. Format:
   * organizations/{organization}/publications/{publication}
   * @param Publication $postBody
   * @param array $optParams Optional parameters.
   *
   * @opt_param string updateMask Optional. The list of fields to update.
   * @return Publication
   * @throws \Google\Service\Exception
   */
  public function patch($name, Publication $postBody, $optParams = [])
  {
    $params = ['name' => $name, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('patch', [$params], Publication::class);
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(OrganizationsPublications::class, 'Google_Service_WebContentPublisher_Resource_OrganizationsPublications');
