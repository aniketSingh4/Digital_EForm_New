/**
 * Handle edit button click - Navigate to edit page
 * @param {Object} report - Report object
 * @param {Function} navigate - React Router navigate function
 */
export const handleEditNavigation = (report, navigate) => {
    if (!report || !report.id) {
        console.error('Invalid report data for edit navigation');
        return;
    }
    navigate(`/pm-reports/edit/${report.id}`);
};

export default {
    handleEditNavigation,
};
