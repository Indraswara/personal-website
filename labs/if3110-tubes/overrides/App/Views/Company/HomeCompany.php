<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Home for Company to Check jobs they post">
    <title>List Job</title>
    <link rel="stylesheet" href="../../../public/styles/global.css">
    <link rel="stylesheet" href="../../../public/styles/navbar.css">
    <link rel="stylesheet" href="../../../public/styles/home/homecompany.css">
    <link rel="stylesheet" href="../../../public/styles/successToast.css">
    <link rel="stylesheet" href="../../../public/styles/errorToast.css">
    <script src="https://kit.fontawesome.com/3816d0d83d.js" crossorigin="anonymous"></script>
</head>

<body>
    <aside>
        <?php
        include(APP_DIR . '/components/error-toast.php');
        include(APP_DIR . '/components/success-toast.php');
        generateErrorToast();
        generateSuccessToast();

        $errorMessage = $_SESSION['error_message'] ?? null;
        unset($_SESSION['error_message']);
        $successMessage = $_SESSION['success_message'] ?? null;
        unset($_SESSION['success_message']);

        // Windowed page list (1 … around current … last) instead of one
        // link per page — see the matching comment in HomeJobSeeker.php.
        if (!function_exists('paginationWindow')) {
            function paginationWindow(int $current, int $total, int $window = 2): array
            {
                if ($total <= 1) {
                    return [1];
                }
                $pages = [1];
                if ($current - $window > 2) {
                    $pages[] = '...';
                }
                for ($p = max(2, $current - $window); $p <= min($total - 1, $current + $window); $p++) {
                    $pages[] = $p;
                }
                if ($current + $window < $total - 1) {
                    $pages[] = '...';
                }
                $pages[] = $total;
                return $pages;
            }
        }
        ?>

        <div hidden id="session-data" data-error-message="<?php echo $errorMessage ?>"
            data-success-message="<?php echo $successMessage ?>">
        </div>
    </aside>

    <main>
        <section class="main-content">
            <section class="profile-section">
                <div class="profile-bg-blue"></div>
                <div class="profile-bg-white">
                    <div class="profile-image">
                        <img width="100px" height="100px" src="../../../public/icons/building.png" class="profile-icon" alt="profile-picture">
                    </div>
                    <h1 class="profile-name"><?php echo isset($companyData['nama']) ? $companyData['nama'] : 'guess' ?>
                    </h1>
                    <h1 class="profile-location">
                        <?php echo isset($companyData['lokasi']) ? $companyData['lokasi'] : 'guess location' ?>
                    </h1>
                    <h1 class="profile-about">
                        <?php echo isset($companyData['about']) ? $companyData['about'] : 'guess about' ?>
                    </h1>


                </div>
            </section>
            <section class="job-lists">
                <h1 class="job-lists-title">Vacancy List</h1>
                <div class="job-container">
                    <?php foreach ($jobs as $index => $job): ?>
                        <button class="job-card" id="job-card">
                            <h1 class="job-title" id="job-title-<?php echo $index; ?>">
                                <?php echo htmlspecialchars($job['posisi']); ?>
                            </h1>
                            <h1 class="job-company" id="job-company-<?php echo $index; ?>">
                                <?php echo $companyData['nama'] ?>
                            </h1>
                            <h1 class="job-location" id="job-location-<?php echo $index; ?>">
                                <?php echo $companyData['lokasi'] ?>
                            </h1>
                            <div class="display-none" id="job-desc-<?php echo $index; ?>">
                                <?= htmlspecialchars_decode($job['deskripsi']); ?>
                            </div>
                            <!-- <p>
                                <?php echo $job['jenis_lokasi']; ?>
                            </p>
                            <p>
                                <?php echo $job['jenis_pekerjaan']; ?>
                            </p>
                             <p>
                                <?php echo $job['is_open'] ? 'Open' : 'Closed'; ?>
                            </p> -->
                            <h1 class="display-none" id="job-status-<?php echo $index; ?>">
                                <?php echo htmlspecialchars($job['jenis_lokasi']); ?>
                            </h1>
                            <h1 class="display-none" id="job-type-<?php echo $index; ?>">
                                <?php echo htmlspecialchars($job['jenis_pekerjaan']); ?>
                            </h1>
                            <h1 class="" id="job-isOpen-<?php echo $index; ?>">
                                <?php echo ($job['is_open'] ? 'Open' : 'Closed'); ?>
                            </h1>
                            <h1 class="display-none" id="job-companyid-<?php echo $index; ?>">
                                <?php echo htmlspecialchars($job['lowongan_id']); ?>
                            </h1>
                            <?php
                                if(isset($lowonganAttachment[$job['lowongan_id']]) && !empty($lowonganAttachment[$job['lowongan_id']])):
                            ?>
                            <?php foreach ($lowonganAttachment[$job['lowongan_id']] as $attach):?>
                                <h1 class="display-none attachment-<?php echo $index;?>">
                                    <?php echo htmlspecialchars($attach['file_path']); ?>
                                </h1>
                            <?php endforeach; ?>
                            <?php endif; ?>
                            <h1></h1>
                        </button>
                    <?php endforeach; ?>
                </div>
            </section>
            <!-- update pagination -->
            <div class="pagination-section">
                <?php if ($currentPage > 1): ?>
                    <a class="pagination-prev" data-page="<?php echo $currentPage - 1; ?>"
                        href="javascript:void(0);">&laquo;
                        Previous</a>
                <?php endif; ?>

                <?php foreach (paginationWindow($currentPage, $totalPages) as $page): ?>
                    <?php if ($page === '...'): ?>
                        <span class="pagination-ellipsis">&hellip;</span>
                    <?php else: ?>
                        <a class="pagination-page <?php echo ($page == $currentPage) ? 'active' : ''; ?>"
                            data-page="<?php echo $page; ?>" href="javascript:void(0);">
                            <?php echo $page; ?>
                        </a>
                    <?php endif; ?>
                <?php endforeach; ?>

                <?php if ($currentPage < $totalPages): ?>
                    <a class="pagination-next" data-page="<?php echo $currentPage + 1; ?>" href="javascript:void(0);">Next
                        &raquo;</a>
                <?php endif; ?>
            </div>
        </section>

        <section class="search-section">
            <form action="" method="get" id="filters-form">
                <div class="search-bar">
                    <input class="search" id="searchInput" type="text" name="search" placeholder="Search jobs..."
                        value="<?php echo htmlspecialchars($searchTerm); ?>" onkeyup="debounceSearch()">
                    <button type="submit">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <span class="sr-only">Search</span>
                    </button>
                </div>

                <div class="filter-container">
                    <div id="locations-checkboxes" class="filter-group">
                        <h4>Locations</h4>
                        <label>
                            <input type="checkbox" name="locations[]" value="on-site" onchange="debounceSearch()">
                            on-site
                        </label><br>
                        <label>
                            <input type="checkbox" name="locations[]" value="hybrid" onchange="debounceSearch()">
                            hybrid
                        </label><br>
                        <label>
                            <input type="checkbox" name="locations[]" value="remote" onchange="debounceSearch()">
                            remote
                        </label><br>
                    </div>
                    <div id="status-checkboxes" class="filter-group">
                        <h4>Statuses</h4>
                        <label>
                            <input type="checkbox" name="statuses[]" value="1" onchange="debounceSearch()">
                            Open
                        </label><br>
                        <label>
                            <input type="checkbox" name="statuses[]" value="0" onchange="debounceSearch()">
                            Closed
                        </label><br>
                    </div>
                    <div id="jobtypes-checkboxes" class="filter-group">
                        <h4>Job Type</h4>
                        <label>
                            <input type="checkbox" name="jobtypes[]" value="Full-time" onchange="debounceSearch()">
                            Full-time
                        </label><br>
                        <label>
                            <input type="checkbox" name="jobtypes[]" value="Part-time" onchange="debounceSearch()">
                            Part-time
                        </label><br>
                        <label>
                            <input type="checkbox" name="jobtypes[]" value="Internship" onchange="debounceSearch()">
                            Internship
                        </label><br>
                    </div>
                    <div>
                        <label for="sort-by">Date Sort:</label>
                        <select class="filter-sortby" id="sort-by" name="sort" onchange="debounceSearch()">
                            <option value="DESC" <?php echo $sort === 'DESC' ? 'selected' : ''; ?>>Newest</option>
                            <option value="ASC" <?php echo $sort === 'ASC' ? 'selected' : ''; ?>>Oldest</option>
                        </select>
                    </div>
                </div>
            </form>
        </section>
        <div id="myModal" class="myModal modal display-none">
            <div class="modal-content" id="modalContent">
                <button class="close" id="close-modal">
                    <img src="../../../public/icons/close.png" class="back-logo">
                </button>
                <h1 id="modal-title" class="modal-title"></h1>
                <div class="modal-geo">
                    <h1 id="modal-company" class="modal-company"></h1>
                    <h1 id="modal-connector" class="modal-connector"> - </h1>
                    <h1 id="modal-location" class="modal-location"></h1>
                </div>
                <div class="modal-job">
                    <i class="modal-logo fa-solid fa-briefcase"></i>
                    <h1 id="modal-status" class="modal-status"></h1>
                    <h1 id="modal-type" class="modal-type"></h1>
                </div>
                <div class="modal-available">
                    <i class="fa-solid fa-tags"></i>
                    <form id="update-status-form">
                        <select id="modal-select" name="is_open">
                            <option value="Open" <?php echo $job['is_open'] ? 'selected' : ''; ?>>Open</option>
                            <option value="Closed" <?php echo !$job['is_open'] ? 'selected' : ''; ?>>Closed
                            </option>
                        </select>
                    </form>
                </div>
                <h1 class="desc">Description</h1>
                <div id="modal-desc" class="modal-desc"></div>
                <div class="modal-attachment">     
                    <div class="modal-image">
                        <img id="Attachment-Image" src="/public/uploads/default.png" alt="Attachment Image">
                    </div>
                    <?php foreach ($jobs as $index => $job): ?>
                        <button class="display-none modal-image-btn prev"
                            id="btn-prev-<?php echo $index ?>">&#10094;</button>
                        <button class="display-none modal-image-btn next"
                            id="btn-next-<?php echo $index ?>">&#10095;</button>
                    <?php endforeach; ?>
                </div>
                <div class="modal-action">
                    <form class="modal-trash" id="modal-delete">
                        <button type="submit" class="btn btn-danger action-btn"
                            onclick="return confirm('Are you sure you want to delete this job?')">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </form>
                    <a id="modal-edit" class="modal-edit">Edit</a>
                    <a id="modal-view" class="modal-view">View Applicants</a>
                </div>
            </div>
        </div>
    </main>
    <?php
    include(__DIR__ . "/../../Components/navbar.php");
    generateNavbar('Company') ?>
    <button id="addLowongan" class="add-lowongan">
        <img src="../../../public/icons/plus.png" width="50px" alt="Add Button">
    </button>
    <div id="modalOverlay" class="modal-overlay display-none"></div>

</body>
<script src="../../../public/js/toast.js" defer></script>
<script src="../../../public/js/HomeCompany.js" defer></script>
<script defer>
    document.addEventListener('DOMContentLoaded', function () {
        const successToast = document.getElementById("success-toast");
        const successMessage = document.getElementById("success-message-content");
        const message = "<?php echo $successMessage; ?>";
        if (successToast && message) {
            successMessage.innerText = message;
            setTimeout(() => {
                successToast.classList.add("show-initial");;
                successToast.classList.remove("hide");
                setTimeout(() => {
                    successToast.classList.add("hide");
                }, 5000);
            }, 500);
        }
        
        document.addEventListener('DOMContentLoaded', function() {
        const profileAbout = document.querySelector('.profile-about');
        profileAbout.innerText = 'Loading profile information...';

        setTimeout(() => {
            profileAbout.innerText = '<?php echo isset($companyData['about']) ? $companyData['about'] : "guess about" ?>';
        }, 500); // Adjust delay based on actual loading time
    });

    });
</script>

</html>