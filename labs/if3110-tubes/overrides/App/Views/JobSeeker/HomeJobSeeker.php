<?php
$lowonganList = $data['lowonganList'] ?? [];
$currentPage = $data['currentPage'] ?? 1;
$totalPages = $data['totalPages'] ?? 1;

// Windowed page list (1 … around current … last) instead of one link per
// page — with the seeded dataset (10k+ listings / 12 per page) the old
// `for ($page = 1; $page <= $totalPages; $page++)` rendered ~836 page
// links in a single row.
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

include(APP_DIR . '/components/success-toast.php');
if (isset($_SESSION['id']) && isset($_SESSION['success_message'])) {
    generateSuccessToast();
}
$successMessage = $_SESSION['success_message'] ?? null;
unset($_SESSION['success_message']);
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="description" content="Find your dream job with our job seeker platform">
    <meta name="viewport" content="width=, initial-scale=1.0">
    <link rel="stylesheet" href="../../../public/styles/global.css">
    <link rel="stylesheet" href="../../../public/styles/navbar.css">
    <link rel="stylesheet" href="../../../public/styles/login.css">
    <link rel="stylesheet" href="../../../public/styles/successToast.css">
    <script src="https://kit.fontawesome.com/3816d0d83d.js" crossorigin="anonymous"></script>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Job Seeker Home</title>
    <link rel="stylesheet" href="../../../public/styles/home/homejobseeker.css">
</head>

<body>
    <?php
    include(__DIR__ . '/../../Components/navbar.php');
    if (isset($_SESSION['role']) && $_SESSION['role'] == 'jobseeker') {
        generateNavbar('JobSeeker');
    } else {
        generateNavbar('Not Login');
    }
    ?>
    <main>
        <section class="profile-section">
            <div class="profile-bg-white">
                <div class="profile-image">
                    <img src="../../../public/icons/profil.png" class="profile-icon" alt="profile-picture">
                </div>
                <h1 class="profile-name"><?php echo isset($_SESSION['name']) ? $_SESSION['name'] : 'guess' ?></h1>
            </div>
        </section>
        <section class="list-vacancy">
            <?php if ($lowonganList): ?>
                <?php foreach ($lowonganList as $index => $lowongan): ?>
                    <button id="job-card" class="job-card">
                        <h1 class="job-title" id="job-title-<?php echo $index; ?>">
                            <?php echo htmlspecialchars($lowongan['posisi']); ?>
                        </h1>
                        <h1 class="job-company" id="job-company-<?php echo $index; ?>">
                            <?php echo htmlspecialchars($lowongan['nama']); ?>
                        </h1>
                        <div class="job-loc-type">
                            <h1 class="job-location" id="job-location-<?php echo $index; ?>">
                                <?php echo htmlspecialchars($lowongan['lokasi']); ?>
                            </h1>
                            <h1 class="job-connector"> - </h1>
                            <h1 class="job-type" id="job-type-<?php echo $index; ?>">
                                <?php echo htmlspecialchars($lowongan['jenis_pekerjaan']); ?>
                            </h1>
                        </div>
                        <div class="display-none" id="job-desc-<?php echo $index; ?>">
                            <?php echo htmlspecialchars_decode($lowongan['deskripsi']); ?>
                        </div>
                        <h1 class="display-none" id="job-status-<?php echo $index; ?>">
                            <?php echo htmlspecialchars($lowongan['jenis_lokasi']); ?>
                        </h1>
                        <h1 class="display-none" id="job-companyid-<?php echo $index; ?>">
                            <?php echo htmlspecialchars($lowongan['lowongan_id']); ?>
                        </h1>
                    </button>
                    <div id="myModal" class="modal display-none">
                        <div class="modal-content display-none" id="modalContent">
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
                            <h1 class="desc">Description</h1>
                            <div id="modal-desc" class="modal-desc"></div>
                            <button class="button-apply" id="button-apply"> Melamar </button>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php else: ?>
                <p>No vacancy available right now!</p>
            <?php endif; ?>

            <!-- 
                pagination it's not href so it can run asynchronously with search and filter (AJAX)
            -->
            <div class="pagination">
                <?php if ($currentPage > 1): ?>
                    <a class="pagination-prev" data-page="<?php echo $currentPage - 1; ?>" href="#">&laquo;
                        Previous</a>
                <?php endif; ?>

                <?php foreach (paginationWindow($currentPage, $totalPages) as $page): ?>
                    <?php if ($page === '...'): ?>
                        <span class="pagination-ellipsis">&hellip;</span>
                    <?php else: ?>
                        <a class="pagination-page <?php echo ($page == $currentPage) ? 'active' : ''; ?>"
                            data-page="<?php echo $page; ?>" href="#">
                            <?php echo $page; ?>
                        </a>
                    <?php endif; ?>
                <?php endforeach; ?>

                <?php if ($currentPage < $totalPages): ?>
                    <a class="pagination-next" data-page="<?php echo $currentPage + 1; ?>" href="#">Next
                        &raquo;</a>
                <?php endif; ?>
            </div>
        </section>
        <form class="search-section" action="" method="get" id="filters-form">
            <div class="search-bar">
                <input class="search" id="searchInput" type="text" name="search" placeholder="Search jobs..."
                    value="<?php echo htmlspecialchars($searchTerm); ?>" onkeyup="debounceSearch()">
                <button type="submit">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <span class="sr-only">Search</span>
                </button>
            </div>

            <div class="filter-container">
                <div id="location-checkboxes" class="filter-group">
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
                <div id="job-type-checkboxes" class="filter-group">
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
                    <select id="sort-by" class="filter-sortby" name="sort" onchange="debounceSearch()">
                        <option value="DESC" <?php echo $sort === 'DESC' ? 'selected' : ''; ?>>Newest</option>
                        <option value="ASC" <?php echo $sort === 'ASC' ? 'selected' : ''; ?>>Oldest</option>
                    </select>
                </div>
            </div>
        </form>
        <div id="modalOverlay" class="modal-overlay display-none"></div>
    </main>
</body>
<script src="/../../../public/js/HomeJobseeker.js"></script>
<script>
    document.addEventListener('DOMContentLoaded', function () {
        const successToast = document.getElementById("success-toast");
        const successMessage = document.getElementById("success-message-content");
        const message = "<?php echo $successMessage; ?>";
        if (successToast && message) {
            successMessage.innerText = message;
            setTimeout(() => {
                successToast.classList.add("show-initial");
                successToast.classList.remove("hide");
                setTimeout(() => {
                    successToast.classList.add("hide");
                }, 5000);
            }, 500); // 0.5-second delay
        }
    });
</script>

</html>