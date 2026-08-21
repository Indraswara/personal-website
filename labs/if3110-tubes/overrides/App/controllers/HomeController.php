<?php

namespace App\Controllers;

use App\Core\Controller;
use App\Interfaces\ControllerInterface;
use App\Models\LowonganModel;
use App\Models\AttachmentModel;
use App\Models\UsersModel;

class HomeController extends Controller implements ControllerInterface
{
    private LowonganModel $modelLowongan;
    private AttachmentModel $attachmentModel;
    private UsersModel $modelUsers;
    public function __construct()
    {
        $this->modelLowongan = $this->model('LowonganModel');
        $this->modelUsers = $this->model('UsersModel');
        $this->attachmentModel = $this->model('AttachmentModel');
    }
    public function index()
    {
        if (isset($_SESSION['role']) && $_SESSION['role'] == 'company') {
            $this->companyHome();

        } else {
            $this->jobSeekerHome();
        }
    }

    public function jobSeekerHome()
    {
        // Initialize variables
        $search = $_GET['search'] ?? '';
        $locationFilter = $_GET['locations'] ?? '';
        $statusFilter = $_GET['statuses'] ?? '';
        $jobtypeFilter = $_GET['jobtypes'] ?? '';
        $sort = $_GET['sort'] ?? 'ASC'; // Default sort by 'Newest'

        // var_dump($sort);

        $currentPage = (int) ($_GET['page'] ?? 1);

        if (!empty($search) || !empty($locationFilter) || !empty($statusFilter) || !empty($sort) || !empty($jobtypeFilter)) {
            $lowonganList = $this->modelLowongan->getSearchQuery($search, $locationFilter, $statusFilter, $jobtypeFilter, $sort);
        } else {
            $lowonganList = $this->modelLowongan->getAllLowongan();
        }
        if ($lowonganList === false) {
            $lowonganList = [];
        }

        // Prepare unique statuses and locations
        $statuses = array_unique(array_column($lowonganList, 'is_open'));
        // Map the numeric statuses to descriptive strings
        $statuses = array_map(function ($status) {
            return $status == 1 ? 'Open' : 'Closed';
        }, $statuses);

        // Pagination setup
        $itemsPerPage = 12;
        $totalItems = count($lowonganList);
        $totalPages = ceil($totalItems / $itemsPerPage);

        // Validate and adjust current page
        if ($currentPage < 1) {
            $currentPage = 1;
        } elseif ($currentPage > $totalPages) {
            $currentPage = $totalPages;
        }

        $offset = ($currentPage - 1) * $itemsPerPage;
        $currentItems = array_slice($lowonganList, $offset, $itemsPerPage);

        // Enrich only the page being displayed (was previously done for
        // every row before pagination — 3 separate getUserById() queries
        // per listing, for every listing in the whole list, on every
        // request. Harmless with a handful of rows, but with the seeded
        // dataset (10k+ listings) that's tens of thousands of queries for
        // one page view. Memoized per company on top, since many listings
        // share the same company.
        $companyCache = [];
        foreach ($currentItems as &$lowongan) {
            $companyId = $lowongan['company_id'];
            if (!isset($companyCache[$companyId])) {
                $companyCache[$companyId] = $this->modelUsers->getUserById($companyId);
            }
            $lowongan['nama'] = $companyCache[$companyId]['nama'];
            $lowongan['lokasi'] = $companyCache[$companyId]['lokasi'];
            $lowongan['about'] = $companyCache[$companyId]['about'];
        }
        unset($lowongan);

        $this->view('JobSeeker', 'HomeJobSeeker', [
            'lowonganList' => $currentItems,
            'currentPage' => $currentPage,
            'totalPages' => $totalPages,
            'searchTerm' => $search,
            'sort' => $sort
        ]);
    }

    public function companyHome()
    {

        $company_id = $_SESSION['id'];
        $companyData = $this->modelUsers->getUserById($company_id);


        $search = $_GET['search'] ?? '';
        $locationFilter = $_GET['locations'] ?? '';
        $statusFilter = $_GET['statuses'] ?? '';
        $jobtypeFilter = $_GET['jobtypes'] ?? '';
        $sort = $_GET['sort'] ?? 'ASC'; // Default sort by 'Newest'

        $currentPage = (int) ($_GET['page'] ?? 1);

        if (!empty($search) || !empty($locationFilter) || !empty($statusFilter) || !empty($jobtypeFilter) || !empty($sort)) {
            // var_dump("masuk sini");
            $jobList = $this->modelLowongan->getSearchQueryCompany($company_id, $search, $locationFilter, $statusFilter, $jobtypeFilter, $sort);
        } else {
            $jobList = $this->modelLowongan->getAllLowonganByCompanyID($company_id);
        }
        if ($jobList === false) {
            $jobList = [];
        }

        $statuses = array_unique(array_column($jobList, 'is_open'));
        $statuses = array_map(function ($status) {
            return $status == 1 ? 'Open' : 'Closed';
        }, $statuses);

        $locations = array_unique(array_column($jobList, 'jenis_lokasi'));
        $jobtypes = array_unique(array_column($jobList, 'jenis_pekerjaan'));

        $itemsPerPage = 12;
        $totalItems = count($jobList);
        $totalPages = ceil($totalItems / $itemsPerPage);

        // Validate and adjust current page
        if ($currentPage < 1) {
            $currentPage = 1;
        } elseif ($currentPage > $totalPages) {
            $currentPage = $totalPages;
        }

        $offset = ($currentPage - 1) * $itemsPerPage;
        $currentItems = array_slice($jobList, $offset, $itemsPerPage);

        // Lowongan
        $lowongans = $this->modelLowongan->getAllLowonganByCompanyID($company_id);
        $lowonganAttachment = [];
        foreach ($lowongans as $lowongan) {
            $lowonganAttachment[$lowongan['lowongan_id']] = $this->attachmentModel->getAttachmentByLowonganID($lowongan['lowongan_id']);
        }
        $this->view('Company', 'HomeCompany', [
            'jobs' => $currentItems,
            'currentPage' => $currentPage,
            'totalPages' => $totalPages,
            'searchTerm' => $search,
            'sort' => $sort,
            'companyData' => $companyData,
            'lowonganAttachment' => $lowonganAttachment,
        ]);
    }
}

// [ 'lowongan_id_1' => [{
//     'file_path'
// }], 'lowongan_id_2' => {
//     'file_path'
// }]
